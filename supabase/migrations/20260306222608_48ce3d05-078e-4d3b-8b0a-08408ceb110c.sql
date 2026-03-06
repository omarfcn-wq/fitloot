
CREATE OR REPLACE FUNCTION public.log_activity(
  p_activity_type text,
  p_duration_minutes integer,
  p_credits_earned integer,
  p_trust_score integer DEFAULT 100,
  p_trust_flags text[] DEFAULT '{}'::text[],
  p_source text DEFAULT 'manual'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_rule RECORD;
  v_activity_id UUID;
  v_profile RECORD;
  v_bmi NUMERIC;
  v_max_multiplier NUMERIC := 1.0;
  v_max_credits INTEGER;
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

  -- Calculate BMI-based effort multiplier from profile
  SELECT weight_kg, height_cm INTO v_profile
  FROM public.profiles WHERE user_id = v_user_id LIMIT 1;

  IF v_profile IS NOT NULL AND v_profile.weight_kg IS NOT NULL AND v_profile.height_cm IS NOT NULL AND v_profile.height_cm > 0 THEN
    v_bmi := v_profile.weight_kg / ((v_profile.height_cm / 100.0) * (v_profile.height_cm / 100.0));
    IF v_bmi >= 35 THEN
      v_max_multiplier := 2.0;
    ELSIF v_bmi >= 30 THEN
      v_max_multiplier := 1.5;
    ELSIF v_bmi >= 25 THEN
      v_max_multiplier := 1.25;
    END IF;
  END IF;

  -- Cap credits: base rate 2/min * effort multiplier
  v_max_credits := CEIL(p_duration_minutes * 2 * v_max_multiplier);
  IF p_credits_earned > v_max_credits THEN
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
$function$;
