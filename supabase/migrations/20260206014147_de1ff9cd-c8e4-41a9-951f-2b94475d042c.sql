-- Allow admins to insert user_roles
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

-- Allow admins to delete user_roles
CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

-- Allow admins to view all user_roles
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

-- Allow admins to view all user_credits (for stats)
CREATE POLICY "Admins can view all user_credits"
ON public.user_credits
FOR SELECT
USING (public.is_admin());

-- Allow admins to view all activities (for stats)
CREATE POLICY "Admins can view all activities"
ON public.activities
FOR SELECT
USING (public.is_admin());

-- Allow admins to view all redemptions (for stats)
CREATE POLICY "Admins can view all redemptions"
ON public.redemptions
FOR SELECT
USING (public.is_admin());

-- Allow admins to view all wearable connections (for stats)
CREATE POLICY "Admins can view all wearable_connections"
ON public.wearable_connections
FOR SELECT
USING (public.is_admin());