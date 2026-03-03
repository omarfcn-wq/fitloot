sql
-- Migration: Add wearable integration support
-- File: supabase/migrations/[timestamp]_wearable_integration.sql

-- Create oauth_states table for secure OAuth flow
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  redirect_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state);
CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states(expires_at);

-- Function to add credits to user balance
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert or update user credits
  INSERT INTO user_credits (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = user_credits.balance + p_amount,
    updated_at = NOW();

  -- Return result
  SELECT json_build_object(
    'success', true,
    'user_id', p_user_id,
    'credits_added', p_amount,
    'new_balance', (SELECT balance FROM user_credits WHERE user_id = p_user_id)
  ) INTO result;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to calculate user fitness stats
CREATE OR REPLACE FUNCTION get_user_fitness_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_activities INTEGER;
  total_minutes INTEGER;
  total_credits INTEGER;
  avg_heart_rate NUMERIC;
  current_streak INTEGER;
BEGIN
  -- Get basic stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(duration_minutes), 0),
    COALESCE(SUM(credits_earned), 0),
    COALESCE(AVG(heart_rate_avg), 0)
  INTO total_activities, total_minutes, total_credits, avg_heart_rate
  FROM activities 
  WHERE user_id = p_user_id;

  -- Calculate current streak (consecutive days with activity)
  WITH daily_activities AS (
    SELECT DATE(completed_at) as activity_date
    FROM activities 
    WHERE user_id = p_user_id
    GROUP BY DATE(completed_at)
    ORDER BY DATE(completed_at) DESC
  ),
  streak_calc AS (
    SELECT 
      activity_date,
      ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
      activity_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY activity_date DESC) - 1) as streak_date
    FROM daily_activities
  )
  SELECT COUNT(*) INTO current_streak
  FROM streak_calc
  WHERE streak_date = (SELECT MIN(streak_date) FROM streak_calc);

  -- Build result
  SELECT json_build_object(
    'total_activities', total_activities,
    'total_minutes', total_minutes,
    'total_credits', total_credits,
    'avg_heart_rate', ROUND(avg_heart_rate, 1),
    'current_streak', COALESCE(current_streak, 0),
    'last_activity', (
      SELECT completed_at 
      FROM activities 
      WHERE user_id = p_user_id 
      ORDER BY completed_at DESC 
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Enhanced user profiles for effort scoringCREATE TABLE IF NOT EXISTS user_fitness_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  birth_date DATE,
  gender VARCHAR(10), -- 'male', 'female', 'other'
  height_cm INTEGER, -- height in centimeters
  weight_kg NUMERIC(5,2), -- weight in kilograms
  activity_level VARCHAR(20) DEFAULT 'moderate', -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
  fitness_goals TEXT[], -- array of goals like 'weight_loss', 'muscle_gain', 'endurance'
  medical_conditions TEXT[], -- optional medical considerations
  resting_heart_rate INTEGER, -- beats per minute
  max_heart_rate INTEGER, -- calculated or measured
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate effort-adjusted credits
CREATE OR REPLACE FUNCTION calculate_effort_credits(
  p_user_id UUID,
  p_duration_minutes INTEGER,
  p_heart_rate_avg INTEGER DEFAULT NULL,
  p_activity_type VARCHAR DEFAULT 'general_exercise'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  profile RECORD;
  base_credits INTEGER;
  effort_multiplier NUMERIC DEFAULT 1.0;
  age_years INTEGER;
  target_hr INTEGER;
  hr_intensity NUMERIC;
BEGIN
  -- Base credits: 2 per minute
  base_credits := p_duration_minutes * 2;

  -- Get user profile
  SELECT * INTO profile
  FROM user_fitness_profiles
  WHERE user_id = p_user_id;

  -- If no profile, return base credits
  IF NOT FOUND THEN
    RETURN base_credits;
  END IF;

  -- Calculate age if birth_date available
  IF profile.birth_date IS NOT NULL THEN
    age_years := EXTRACT(YEAR FROM AGE(profile.birth_date));
  END IF;

  -- Effort multiplier based on user characteristics
  CASE 
    WHEN profile.activity_level = 'sedentary' THEN effort_multiplier := 1.3;
    WHEN profile.activity_level = 'light' THEN effort_multiplier := 1.2;
    WHEN profile.activity_level = 'moderate' THEN effort_multiplier := 1.0;
    WHEN profile.activity_level = 'active' THEN effort_multiplier := 0.9;
    WHEN profile.activity_level = 'very_active' THEN effort_multiplier := 0.8;
  END CASE;

  -- Heart rate intensity bonus
  IF p_heart_rate_avg IS NOT NULL AND age_years IS NOT NULL THEN
    -- Calculate target heart rate (simple 220 - age formula)
    target_hr := 220 - age_years;
    hr_intensity := (p_heart_rate_avg::NUMERIC / target_hr);
    
    -- Bonus for higher intensity
    IF hr_intensity > 0.7 THEN effort_multiplier := effort_multiplier * 1.2;
    ELSIF hr_intensity > 0.5 THEN effort_multiplier := effort_multiplier * 1.1;
    END IF;
  END IF;

  -- Weight-based adjustment (heavier people burn more calories for same effort)
  IF profile.weight_kg IS NOT NULL THEN
    IF profile.weight_kg > 90 THEN effort_multiplier := effort_multiplier * 1.15;
    ELSIF profile.weight_kg > 70 THEN effort_multiplier := effort_multiplier * 1.05;
    ELSIF profile.weight_kg < 50 THEN effort_multiplier := effort_multiplier * 0.95;
    END IF;
  END IF;

  -- Cap the multiplier between 0.5 and 2.0
  effort_multiplier := GREATEST(0.5, LEAST(2.0, effort_multiplier));

  RETURN ROUND(base_credits * effort_multiplier);
END;
$$;

-- Row Level Security policies
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fitness_profiles ENABLE ROW LEVELDELETE FROM oauth_states 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
``` SECURITY;

-- Only users can access their own OAuth states
CREATE POLICY oauth_states_user_policy ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

-- Only users can access their own fitness profiles
CREATE POLICY fitness_profiles_user_policy ON user_fitness_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON oauth_states TO authenticated;
GRANT ALL ON user_fitness_profiles TO authenticated;

-- Cleanup function for expired OAuth states (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
