
-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  credits_awarded INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Add referral_code column to user profiles via a dedicated table
CREATE TABLE public.user_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS for referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (public.is_admin());

-- RLS for referral codes
CREATE POLICY "Anyone can view referral codes" ON public.user_referral_codes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own code" ON public.user_referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all codes" ON public.user_referral_codes
  FOR SELECT USING (public.is_admin());

-- Auto-generate referral code on new user signup
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_referral_codes (user_id, referral_code)
  VALUES (NEW.id, upper(substr(md5(NEW.id::text || now()::text), 1, 8)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Function to process referral and award credits
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_current_user UUID;
  v_bonus INTEGER := 50;
BEGIN
  v_current_user := auth.uid();
  IF v_current_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Check if user already used a referral
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_current_user) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya usaste un código de referido');
  END IF;

  -- Find referrer
  SELECT user_id INTO v_referrer_id
  FROM public.user_referral_codes
  WHERE referral_code = upper(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de referido inválido');
  END IF;

  -- Can't refer yourself
  IF v_referrer_id = v_current_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes usar tu propio código');
  END IF;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, credits_awarded)
  VALUES (v_referrer_id, v_current_user, upper(p_referral_code), v_bonus);

  -- Award credits to referrer
  UPDATE public.user_credits SET balance = balance + v_bonus WHERE user_id = v_referrer_id;

  -- Award credits to referred user
  UPDATE public.user_credits SET balance = balance + v_bonus WHERE user_id = v_current_user;

  -- Notify referrer
  INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
  VALUES (v_referrer_id, 'referral', '🎉 ¡Nuevo Referido!', 'Un amigo usó tu código de referido. ¡Ganaste ' || v_bonus || ' créditos!', 'user-plus', jsonb_build_object('credits', v_bonus));

  -- Notify referred
  INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
  VALUES (v_current_user, 'referral', '🎁 ¡Bienvenido!', 'Código de referido aplicado. ¡Ganaste ' || v_bonus || ' créditos!', 'gift', jsonb_build_object('credits', v_bonus));

  RETURN jsonb_build_object('success', true, 'credits', v_bonus);
END;
$$;

-- Generate codes for existing users
INSERT INTO public.user_referral_codes (user_id, referral_code)
SELECT id, upper(substr(md5(id::text || now()::text), 1, 8))
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_referral_codes);
