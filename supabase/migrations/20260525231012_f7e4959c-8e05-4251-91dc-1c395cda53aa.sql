CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.has_active_premium(_user_id uuid, _env text DEFAULT 'live')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND environment = _env
      AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

-- Update log_activity to add Premium 1.5x multiplier on top of BMI
CREATE OR REPLACE FUNCTION public.log_activity(p_activity_type text, p_duration_minutes integer, p_credits_earned integer, p_trust_score integer DEFAULT 100, p_trust_flags text[] DEFAULT '{}'::text[], p_source text DEFAULT 'manual'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_user_id UUID;
  v_rule RECORD;
  v_activity_id UUID;
  v_profile RECORD;
  v_bmi NUMERIC;
  v_max_multiplier NUMERIC := 1.0;
  v_premium_mult NUMERIC := 1.0;
  v_max_credits INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT * INTO v_rule FROM public.activity_validation_rules WHERE activity_type = p_activity_type LIMIT 1;
  IF v_rule IS NOT NULL THEN
    IF p_duration_minutes < v_rule.min_duration_minutes OR p_duration_minutes > v_rule.max_duration_minutes THEN
      RETURN jsonb_build_object('success', false, 'error', 'Duración fuera de rango permitido');
    END IF;
  END IF;

  SELECT weight_kg, height_cm INTO v_profile FROM public.profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_profile IS NOT NULL AND v_profile.weight_kg IS NOT NULL AND v_profile.height_cm IS NOT NULL AND v_profile.height_cm > 0 THEN
    v_bmi := v_profile.weight_kg / ((v_profile.height_cm / 100.0) * (v_profile.height_cm / 100.0));
    IF v_bmi >= 35 THEN v_max_multiplier := 2.0;
    ELSIF v_bmi >= 30 THEN v_max_multiplier := 1.5;
    ELSIF v_bmi >= 25 THEN v_max_multiplier := 1.25;
    END IF;
  END IF;

  -- Premium multiplier (applies to both sandbox and live)
  IF public.has_active_premium(v_user_id, 'live') OR public.has_active_premium(v_user_id, 'sandbox') THEN
    v_premium_mult := 1.5;
  END IF;

  v_max_credits := CEIL(p_duration_minutes * 2 * v_max_multiplier * v_premium_mult);
  IF p_credits_earned > v_max_credits THEN
    RETURN jsonb_build_object('success', false, 'error', 'Créditos exceden el máximo permitido');
  END IF;

  INSERT INTO public.activities (user_id, activity_type, duration_minutes, credits_earned, trust_score, trust_flags, source)
  VALUES (v_user_id, p_activity_type, p_duration_minutes, p_credits_earned, p_trust_score, p_trust_flags, p_source)
  RETURNING id INTO v_activity_id;

  UPDATE public.user_credits SET balance = balance + p_credits_earned WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'activity_id', v_activity_id, 'credits_earned', p_credits_earned, 'premium', v_premium_mult > 1.0);
END;
$function$;