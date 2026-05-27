
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_achievement_earned() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_level_up() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, public;
