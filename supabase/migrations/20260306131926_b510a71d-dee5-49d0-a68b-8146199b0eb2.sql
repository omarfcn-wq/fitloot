
-- Trainers table (partner trainers)
CREATE TABLE public.trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_flag TEXT NOT NULL DEFAULT '🏳️',
  bio TEXT,
  specialty TEXT NOT NULL DEFAULT 'general',
  avatar_url TEXT,
  social_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active trainers" ON public.trainers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage trainers" ON public.trainers
  FOR ALL USING (is_admin());

-- Routines table
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  category TEXT NOT NULL DEFAULT 'strength',
  video_url TEXT,
  thumbnail_url TEXT,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published routines" ON public.routines
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage routines" ON public.routines
  FOR ALL USING (is_admin());

-- User routine progress tracking
CREATE TABLE public.user_routine_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT,
  UNIQUE(user_id, routine_id, completed_at)
);

ALTER TABLE public.user_routine_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.user_routine_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_routine_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_routine_progress
  FOR SELECT USING (is_admin());
