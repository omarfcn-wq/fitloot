-- ===========================================
-- FitLoot MVP Database Schema
-- ===========================================

-- 1. Enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. User roles table (for admin management)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. User credits table
CREATE TABLE public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 4. Activities table (exercise logs)
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    credits_earned INTEGER NOT NULL CHECK (credits_earned >= 0),
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    source TEXT DEFAULT 'manual', -- 'manual', 'fitbit', 'apple_health', etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 5. Rewards catalog
CREATE TABLE public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    credits_cost INTEGER NOT NULL CHECK (credits_cost > 0),
    category TEXT NOT NULL DEFAULT 'general', -- 'skin', 'pass', 'game', 'accessory'
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER, -- NULL means unlimited
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 6. Redemptions history
CREATE TABLE public.redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
    credits_spent INTEGER NOT NULL CHECK (credits_spent > 0),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- Helper Functions
-- ===========================================

-- Check if user has admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-create user_credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.id, 0);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================
-- Triggers
-- ===========================================

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON public.user_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- RLS Policies
-- ===========================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- User Credits Policies
CREATE POLICY "Users can view their own credits"
    ON public.user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
    ON public.user_credits FOR UPDATE
    USING (auth.uid() = user_id);

-- Activities Policies
CREATE POLICY "Users can view their own activities"
    ON public.activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
    ON public.activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
    ON public.activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
    ON public.activities FOR DELETE
    USING (auth.uid() = user_id);

-- Rewards Policies (public read, admin write)
CREATE POLICY "Anyone can view available rewards"
    ON public.rewards FOR SELECT
    USING (true);

CREATE POLICY "Admins can create rewards"
    ON public.rewards FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update rewards"
    ON public.rewards FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete rewards"
    ON public.rewards FOR DELETE
    USING (public.is_admin());

-- Redemptions Policies
CREATE POLICY "Users can view their own redemptions"
    ON public.redemptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions"
    ON public.redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);