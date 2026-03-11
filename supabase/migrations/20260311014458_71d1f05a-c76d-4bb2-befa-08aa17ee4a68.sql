
CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_reward RECORD;
  v_balance INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Get reward details
  SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id AND is_available = true;
  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa no disponible');
  END IF;

  -- Check stock
  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sin stock disponible');
  END IF;

  -- Check balance
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = v_user_id;
  IF v_balance IS NULL OR v_balance < v_reward.credits_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Créditos insuficientes');
  END IF;

  -- Deduct credits
  UPDATE public.user_credits SET balance = balance - v_reward.credits_cost WHERE user_id = v_user_id;

  -- Decrease stock if applicable
  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.rewards SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  -- Insert redemption
  INSERT INTO public.redemptions (user_id, reward_id, credits_spent, status)
  VALUES (v_user_id, p_reward_id, v_reward.credits_cost, 'completed');

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
  VALUES (v_user_id, 'reward', '🎁 ¡Canje Exitoso!', 'Has canjeado "' || v_reward.name || '" por ' || v_reward.credits_cost || ' créditos.', 'gift', jsonb_build_object('reward_id', p_reward_id, 'credits_spent', v_reward.credits_cost));

  RETURN jsonb_build_object('success', true, 'credits_spent', v_reward.credits_cost, 'new_balance', v_balance - v_reward.credits_cost);
END;
$$;
