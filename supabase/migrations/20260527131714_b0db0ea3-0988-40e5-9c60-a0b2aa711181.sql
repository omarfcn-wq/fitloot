
-- 1. Restrict user_referral_codes SELECT to owner only
DROP POLICY IF EXISTS "Anyone can view referral codes" ON public.user_referral_codes;

CREATE POLICY "Users can view their own referral code"
ON public.user_referral_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Realtime channel authorization: restrict subscriptions to user's own notifications topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own notifications topic" ON realtime.messages;
CREATE POLICY "Users subscribe to own notifications topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications-' || auth.uid()::text
);

-- 3. Revoke public/anon EXECUTE on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.log_activity(text, integer, integer, integer, text[], text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_reward(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.earn_achievement(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.process_referral(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_premium(uuid, text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.log_activity(text, integer, integer, integer, text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.earn_achievement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_premium(uuid, text) TO authenticated;

-- 4. Add explicit deny-by-default policy doc on oauth_states (service role bypasses RLS)
-- No SELECT/INSERT/UPDATE/DELETE policies = no access for anon/authenticated. Service role bypasses RLS.
-- Add comment for clarity
COMMENT ON TABLE public.oauth_states IS 'OAuth state tokens. Accessed only by service role (edge functions). RLS denies all user access by default.';
