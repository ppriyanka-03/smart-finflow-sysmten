-- =====================================================
-- SMART FINANCE HUB - COMPLETE DATABASE SETUP
-- =====================================================
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- =====================================================

-- 1. DROP EXISTING TABLES (Clean Start)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.emi_loans CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 2. CREATE CORE TABLES

-- Users Wallet Table (Primary financial data)
CREATE TABLE public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  monthly_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  monthly_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
  savings DECIMAL(15,2) NOT NULL DEFAULT 0,
  investment_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cashback DECIMAL(15,2) NOT NULL DEFAULT 0,
  month_cashback DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Transactions Table (Complete transaction history)
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'payment')),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  method TEXT CHECK (method IN ('bank', 'wallet', 'upi', 'card', 'cash')),
  recipient TEXT,
  recipient_email TEXT,
  cashback_earned DECIMAL(15,2) DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts Table (User-added banks)
CREATE TABLE public.bank_accounts (
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

-- User Settings Table (UPI, security, preferences)
CREATE TABLE public.user_settings (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- EMI Loans Table (Existing functionality)
CREATE TABLE public.emi_loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  loan_name TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  remaining_amount DECIMAL(15,2) NOT NULL,
  monthly_emi DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  next_payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE TRIGGERS FOR UPDATED_AT
CREATE TRIGGER handle_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_emi_loans_updated_at
  BEFORE UPDATE ON public.emi_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_loans ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- Wallets Policies
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Bank Accounts Policies
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- EMI Loans Policies
CREATE POLICY "Users can view own emi loans" ON public.emi_loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emi loans" ON public.emi_loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emi loans" ON public.emi_loans
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX idx_emi_loans_user_id ON public.emi_loans(user_id);

-- 8. CREATE INITIAL DATA FOR EXISTING USERS
-- This will only create data for users who exist but have no wallet
INSERT INTO public.wallets (user_id, total_balance, wallet_balance, monthly_income, monthly_expenses, savings, investment_value, total_cashback, month_cashback)
SELECT 
  auth.users.id,
  285400,  -- total_balance
  42500,   -- wallet_balance
  125000,  -- monthly_income
  68500,   -- monthly_expenses
  156000,  -- savings
  340000,  -- investment_value
  3250,    -- total_cashback
  850      -- month_cashback
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets WHERE wallets.user_id = auth.users.id
);

-- Create default bank accounts for users with wallet but no bank accounts
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
WHERE EXISTS (
  SELECT 1 FROM public.wallets WHERE wallets.user_id = auth.users.id
) AND NOT EXISTS (
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
  SELECT 1 FROM public.wallets WHERE wallets.user_id = auth.users.id
) AND EXISTS (
  SELECT 1 FROM public.bank_accounts WHERE bank_accounts.user_id = auth.users.id AND bank_accounts.is_default = true
) AND NOT EXISTS (
  SELECT 1 FROM public.bank_accounts WHERE bank_accounts.user_id = auth.users.id AND bank_accounts.is_default = false
);

-- Create default user settings for existing users
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

-- 9. CREATE SAMPLE TRANSACTIONS FOR TESTING (Optional)
INSERT INTO public.transactions (user_id, type, description, amount, method, recipient, date)
SELECT 
  auth.users.id,
  'expense',
  'Grocery Shopping',
  2500,
  'wallet',
  'Big Bazaar',
  NOW() - INTERVAL '2 days'
FROM auth.users
WHERE EXISTS (
  SELECT 1 FROM public.wallets WHERE wallets.user_id = auth.users.id
) AND NOT EXISTS (
  SELECT 1 FROM public.transactions WHERE transactions.user_id = auth.users.id
);

INSERT INTO public.transactions (user_id, type, description, amount, method, recipient, date)
SELECT 
  auth.users.id,
  'income',
  'Monthly Salary',
  125000,
  'bank',
  'Company XYZ',
  NOW() - INTERVAL '7 days'
FROM auth.users
WHERE EXISTS (
  SELECT 1 FROM public.wallets WHERE wallets.user_id = auth.users.id
) AND (
  SELECT COUNT(*) FROM public.transactions WHERE transactions.user_id = auth.users.id
) = 1;

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================
