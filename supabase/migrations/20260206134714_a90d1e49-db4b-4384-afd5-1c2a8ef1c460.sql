-- Create achievements table
CREATE TABLE public.achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'trophy',
    category TEXT NOT NULL DEFAULT 'general',
    requirement_type TEXT NOT NULL, -- 'activities_count', 'total_minutes', 'credits_earned', 'streak_days', 'first_action'
    requirement_value INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Create user_levels table to track XP and level progress
CREATE TABLE public.user_levels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Achievements policies (everyone can view)
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

CREATE POLICY "Admins can manage achievements"
ON public.achievements FOR ALL
USING (public.is_admin());

-- User achievements policies
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user achievements"
ON public.user_achievements FOR SELECT
USING (public.is_admin());

-- User levels policies
CREATE POLICY "Users can view their own level"
ON public.user_levels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own level"
ON public.user_levels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create user levels"
ON public.user_levels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user levels"
ON public.user_levels FOR SELECT
USING (public.is_admin());

-- Trigger to update updated_at on user_levels
CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON public.user_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Modify handle_new_user to also create user_levels entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.id, 0);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    INSERT INTO public.user_levels (user_id, current_xp, current_level)
    VALUES (NEW.id, 0, 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
-- Beginner achievements
('Primera Actividad', 'Registra tu primera actividad física', 'play', 'beginner', 'activities_count', 1, 10),
('Semana Activa', 'Completa 7 actividades', 'calendar', 'beginner', 'activities_count', 7, 25),
('Maratonista', 'Completa 30 actividades', 'flame', 'milestone', 'activities_count', 30, 50),
('Centenario', 'Completa 100 actividades', 'crown', 'milestone', 'activities_count', 100, 150),

-- Time-based achievements
('30 Minutos', 'Acumula 30 minutos de ejercicio', 'clock', 'time', 'total_minutes', 30, 15),
('1 Hora Activa', 'Acumula 60 minutos de ejercicio', 'clock', 'time', 'total_minutes', 60, 25),
('5 Horas de Poder', 'Acumula 300 minutos de ejercicio', 'zap', 'time', 'total_minutes', 300, 75),
('Atleta 10 Horas', 'Acumula 600 minutos de ejercicio', 'trophy', 'time', 'total_minutes', 600, 150),

-- Credits achievements
('Primeros Créditos', 'Gana tus primeros 50 créditos', 'coins', 'credits', 'credits_earned', 50, 20),
('Ahorrista', 'Acumula 500 créditos', 'piggy-bank', 'credits', 'credits_earned', 500, 50),
('Rico en Salud', 'Acumula 2000 créditos', 'gem', 'credits', 'credits_earned', 2000, 100),

-- Streak achievements
('Racha de 3 Días', 'Mantén actividad 3 días seguidos', 'flame', 'streak', 'streak_days', 3, 30),
('Semana Perfecta', 'Mantén actividad 7 días seguidos', 'star', 'streak', 'streak_days', 7, 75),
('Mes Imparable', 'Mantén actividad 30 días seguidos', 'medal', 'streak', 'streak_days', 30, 200);