-- Complete Database Setup for Smart Finance Hub
-- Run this in Supabase SQL Editor to set up all required tables

-- 1. Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Settings Table
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

-- 3. Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers for updated_at
CREATE TRIGGER handle_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Bank Accounts
CREATE POLICY "Users can view their own bank accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts" ON public.bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS Policies for User Settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 9. Create demo bank accounts for existing users (optional)
-- This will only run if there are existing users but no bank accounts
INSERT INTO public.bank_accounts (user_id, bank_name, account_number, ifsc_code, account_holder, balance, is_default)
SELECT 
  auth.users.id,
  'HDFC Bank',
  'XXXX1234',
  'HDFC0001',
  'Primary Account',
  150000,
  true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.bank_accounts WHERE bank_accounts.user_id = auth.users.id
);

INSERT INTO public.bank_accounts (user_id, bank_name, account_number, ifsc_code, account_holder, balance, is_default)
SELECT 
  auth.users.id,
  'SBI Bank',
  'XXXX5678',
  'SBIN0002',
  'Savings Account',
  135400,
  false
FROM auth.users
WHERE EXISTS (
  SELECT 1 FROM public.bank_accounts WHERE bank_accounts.user_id = auth.users.id AND bank_accounts.is_default = true
) AND NOT EXISTS (
  SELECT 1 FROM public.bank_accounts WHERE bank_accounts.user_id = auth.users.id AND bank_accounts.is_default = false
);

-- 10. Create default user settings for existing users (optional)
INSERT INTO public.user_settings (user_id, upi_id, upi_name, security_notifications, payment_notifications, monthly_reports, biometric_enabled, pin_set, dark_mode, currency, language)
SELECT 
  auth.users.id,
  'demo@upi',
  'SmartFinFlow User',
  true,
  true,
  true,
  false,
  false,
  false,
  'INR',
  'en'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings WHERE user_settings.user_id = auth.users.id
);
