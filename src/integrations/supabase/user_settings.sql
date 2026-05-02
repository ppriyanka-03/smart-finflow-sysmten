-- User Settings Table for Finance Application
-- This table stores user preferences and settings

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  upi_id TEXT,
  upi_name TEXT,
  security_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  monthly_reports BOOLEAN DEFAULT true,
  biometric_enabled BOOLEAN DEFAULT false,
  pin_set BOOLEAN DEFAULT false,
  dark_mode BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'INR',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own settings
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own settings
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own settings
CREATE POLICY "Users can delete their own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
