
-- ============================================
-- 1. SECURITY DEFINER function: log_activity
-- Validates and logs an activity, awards credits
-- ============================================
CREATE OR REPLACE FUNCTION public.log_activity(
  p_activity_type text,
  p_duration_minutes integer,
  p_credits_earned integer,
  p_trust_score integer DEFAULT 100,
  p_trust_flags text[] DEFAULT '{}'::text[],
  p_source text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_rule RECORD;
  v_activity_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Validate duration against rules
  SELECT * INTO v_rule FROM public.activity_validation_rules 
  WHERE activity_type = p_activity_type LIMIT 1;
  
  IF v_rule IS NOT NULL THEN
    IF p_duration_minutes < v_rule.min_duration_minutes OR p_duration_minutes > v_rule.max_duration_minutes THEN
      RETURN jsonb_build_object('success', false, 'error', 'Duración fuera de rango permitido');
    END IF;
  END IF;

  -- Cap credits to prevent abuse (max 2 credits per minute * duration)
  IF p_credits_earned > p_duration_minutes * 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Créditos exceden el máximo permitido');
  END IF;

  -- Insert activity
  INSERT INTO public.activities (user_id, activity_type, duration_minutes, credits_earned, trust_score, trust_flags, source)
  VALUES (v_user_id, p_activity_type, p_duration_minutes, p_credits_earned, p_trust_score, p_trust_flags, p_source)
  RETURNING id INTO v_activity_id;

  -- Award credits
  UPDATE public.user_credits SET balance = balance + p_credits_earned WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'activity_id', v_activity_id, 'credits_earned', p_credits_earned);
END;
$$;

-- ============================================
-- 2. SECURITY DEFINER function: earn_achievement
-- Validates and awards an achievement + XP
-- ============================================
CREATE OR REPLACE FUNCTION public.earn_achievement(
  p_achievement_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_achievement RECORD;
  v_user_stats RECORD;
  v_earned BOOLEAN := false;
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_xp_per_level INTEGER := 100;
  v_xp_multiplier NUMERIC := 1.5;
  v_temp_xp INTEGER;
  v_temp_level_xp INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Check if already earned
  IF EXISTS (SELECT 1 FROM public.user_achievements WHERE user_id = v_user_id AND achievement_id = p_achievement_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Logro ya obtenido');
  END IF;

  -- Get achievement details
  SELECT * INTO v_achievement FROM public.achievements WHERE id = p_achievement_id AND is_active = true;
  IF v_achievement IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Logro no encontrado');
  END IF;

  -- Get user stats to validate
  SELECT 
    COUNT(*)::integer as total_activities,
    COALESCE(SUM(duration_minutes), 0)::integer as total_minutes,
    COALESCE(SUM(credits_earned), 0)::integer as total_credits
  INTO v_user_stats
  FROM public.activities WHERE user_id = v_user_id;

  -- Validate requirement
  CASE v_achievement.requirement_type
    WHEN 'activities_count' THEN v_earned := v_user_stats.total_activities >= v_achievement.requirement_value;
    WHEN 'total_minutes' THEN v_earned := v_user_stats.total_minutes >= v_achievement.requirement_value;
    WHEN 'credits_earned' THEN v_earned := v_user_stats.total_credits >= v_achievement.requirement_value;
    ELSE v_earned := false;
  END CASE;

  IF NOT v_earned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisitos no cumplidos');
  END IF;

  -- Award achievement
  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, p_achievement_id);

  -- Update XP and level
  SELECT COALESCE(current_xp, 0) INTO v_current_xp FROM public.user_levels WHERE user_id = v_user_id;
  v_new_xp := COALESCE(v_current_xp, 0) + v_achievement.xp_reward;

  -- Calculate level from XP
  v_new_level := 1;
  v_temp_xp := v_new_xp;
  v_temp_level_xp := v_xp_per_level;
  WHILE v_temp_xp >= v_temp_level_xp LOOP
    v_temp_xp := v_temp_xp - v_temp_level_xp;
    v_new_level := v_new_level + 1;
    v_temp_level_xp := floor(v_xp_per_level * power(v_xp_multiplier, v_new_level - 1))::integer;
  END LOOP;

  UPDATE public.user_levels SET current_xp = v_new_xp, current_level = v_new_level WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'xp_reward', v_achievement.xp_reward, 'new_xp', v_new_xp, 'new_level', v_new_level);
END;
$$;

-- ============================================
-- 3. RESTRICT RLS POLICIES
-- ============================================

-- user_credits: Remove direct UPDATE by users
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- activities: Remove direct INSERT by users (must go through log_activity RPC)
DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;
-- Also remove direct UPDATE and DELETE
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

-- user_achievements: Remove direct INSERT by users (must go through earn_achievement RPC)
DROP POLICY IF EXISTS "Users can earn achievements" ON public.user_achievements;

-- user_levels: Remove direct UPDATE and INSERT by users
DROP POLICY IF EXISTS "Users can update their own level" ON public.user_levels;
DROP POLICY IF EXISTS "System can create user levels" ON public.user_levels;

-- referrals: Remove direct INSERT by users (already handled by process_referral RPC)
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
