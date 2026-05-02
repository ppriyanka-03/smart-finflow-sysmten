// Create database tables via Supabase REST API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

async function createTables() {
  console.log('Creating database tables...');
  
  // We'll create a minimal working setup first
  const sql = `
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
  `;
  
  console.log('SQL prepared:', sql);
  console.log('\n⚠️  MANUAL STEP REQUIRED:');
  console.log('1. Open: https://njgsuadqylclghesoavg.supabase.co/project/sql');
  console.log('2. Paste this SQL:');
  console.log('---');
  console.log(sql);
  console.log('---');
  console.log('3. Click "Run"');
  console.log('4. Then test at: http://localhost:4000');
}

createTables();
