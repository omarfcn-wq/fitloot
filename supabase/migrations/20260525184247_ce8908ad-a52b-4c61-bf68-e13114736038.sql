
ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS delivery_code text,
  ADD COLUMN IF NOT EXISTS delivery_notes text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_by uuid;

CREATE POLICY "Admins can update redemptions"
ON public.redemptions
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());
