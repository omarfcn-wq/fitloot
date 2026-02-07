-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'achievement', 'trust_score', 'credits', 'level_up'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'bell',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications for users"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (is_admin());

-- Index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create notification when achievement is earned
CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
BEGIN
  SELECT name, description, icon INTO achievement_record
  FROM public.achievements
  WHERE id = NEW.achievement_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
  VALUES (
    NEW.user_id,
    'achievement',
    '🏆 ¡Logro Desbloqueado!',
    COALESCE(achievement_record.name, 'Nuevo logro') || ': ' || COALESCE(achievement_record.description, ''),
    COALESCE(achievement_record.icon, 'trophy'),
    jsonb_build_object('achievement_id', NEW.achievement_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for achievement notifications
CREATE TRIGGER on_achievement_earned
AFTER INSERT ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.notify_achievement_earned();

-- Function to create notification when level up
CREATE OR REPLACE FUNCTION public.notify_level_up()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_level > OLD.current_level THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
    VALUES (
      NEW.user_id,
      'level_up',
      '⬆️ ¡Subiste de Nivel!',
      'Has alcanzado el nivel ' || NEW.current_level || '. ¡Sigue así!',
      'trending-up',
      jsonb_build_object('old_level', OLD.current_level, 'new_level', NEW.current_level)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for level up notifications
CREATE TRIGGER on_level_up
AFTER UPDATE ON public.user_levels
FOR EACH ROW
WHEN (NEW.current_level > OLD.current_level)
EXECUTE FUNCTION public.notify_level_up();