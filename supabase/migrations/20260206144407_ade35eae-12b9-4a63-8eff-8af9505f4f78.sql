-- Add trust score columns to activities table
ALTER TABLE public.activities
ADD COLUMN trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
ADD COLUMN trust_flags TEXT[] DEFAULT '{}',
ADD COLUMN heart_rate_avg INTEGER,
ADD COLUMN heart_rate_max INTEGER,
ADD COLUMN calories_burned INTEGER,
ADD COLUMN distance_meters INTEGER;

-- Add index for querying suspicious activities
CREATE INDEX idx_activities_trust_score ON public.activities (trust_score);

-- Create activity validation rules table for configurable thresholds
CREATE TABLE public.activity_validation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type TEXT NOT NULL UNIQUE,
    min_duration_minutes INTEGER NOT NULL DEFAULT 5,
    max_duration_minutes INTEGER NOT NULL DEFAULT 300,
    expected_hr_min INTEGER DEFAULT 80,
    expected_hr_max INTEGER DEFAULT 180,
    min_calories_per_minute NUMERIC DEFAULT 3,
    max_calories_per_minute NUMERIC DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_validation_rules ENABLE ROW LEVEL SECURITY;

-- Anyone can read validation rules (they're configuration data)
CREATE POLICY "Anyone can view validation rules"
ON public.activity_validation_rules
FOR SELECT
USING (true);

-- Only admins can manage rules
CREATE POLICY "Admins can manage validation rules"
ON public.activity_validation_rules
FOR ALL
USING (is_admin());

-- Insert default validation rules for common activities
INSERT INTO public.activity_validation_rules (activity_type, min_duration_minutes, max_duration_minutes, expected_hr_min, expected_hr_max, min_calories_per_minute, max_calories_per_minute) VALUES
('running', 5, 180, 120, 190, 8, 18),
('cycling', 10, 300, 100, 175, 5, 15),
('gym', 15, 180, 90, 170, 4, 12),
('swimming', 10, 120, 110, 180, 7, 14),
('hiking', 20, 480, 90, 160, 4, 10),
('walking', 10, 180, 70, 130, 2, 6),
('yoga', 15, 120, 60, 120, 1, 4),
('exercise', 5, 240, 80, 175, 3, 15);

COMMENT ON TABLE public.activity_validation_rules IS 'Configurable thresholds for activity fraud detection';
COMMENT ON COLUMN public.activities.trust_score IS 'Anti-fraud score from 0-100, higher is more trusted';
COMMENT ON COLUMN public.activities.trust_flags IS 'Array of flags indicating potential issues';