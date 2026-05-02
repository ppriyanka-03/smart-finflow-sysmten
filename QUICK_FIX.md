# 🚀 QUICK FIX - Login Error Solution

## Current Status
✅ Application running: http://localhost:4000  
❌ Email signups disabled in Supabase  
❌ Database tables missing  

## 2-Minute Fix Required

### Step 1: Enable Email Signups (30 seconds)
1. Go to: https://njgsuadqylclghesoavg.supabase.co/project/auth/settings
2. Find "Allow new users to sign up" 
3. Toggle it **ON**
4. Click **Save**

### Step 2: Apply Database Schema (60 seconds)
1. Go to: https://njgsuadqylclghesoavg.supabase.co/project/sql
2. Paste this SQL and click **Run**:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create other tables
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment', 'emi', 'cashback', 'income')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT,
  recipient TEXT,
  recipient_email TEXT,
  cashback_earned NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_balance NUMERIC NOT NULL DEFAULT 285400,
  wallet_balance NUMERIC NOT NULL DEFAULT 42500,
  monthly_income NUMERIC NOT NULL DEFAULT 125000,
  monthly_expenses NUMERIC NOT NULL DEFAULT 68500,
  savings NUMERIC NOT NULL DEFAULT 156000,
  investment_value NUMERIC NOT NULL DEFAULT 340000,
  total_cashback NUMERIC NOT NULL DEFAULT 3250,
  month_cashback NUMERIC NOT NULL DEFAULT 850,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
```

### Step 3: Test the Application (30 seconds)
1. Go to: http://localhost:4000
2. Click "Create account"
3. Register with any email/password
4. Try logging in

## ✅ Expected Result
- Registration works
- Login redirects to dashboard
- All features functional

## 🔧 Troubleshooting
If still not working:
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check browser console for errors

## 📱 Direct Links
- **App**: http://localhost:4000
- **Supabase Auth**: https://njgsuadqylclghesoavg.supabase.co/project/auth/settings
- **Supabase SQL**: https://njgsuadqylclghesoavg.supabase.co/project/sql
