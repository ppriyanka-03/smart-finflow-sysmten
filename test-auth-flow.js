// Test complete authentication flow
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthFlow() {
  console.log('🧪 Testing complete auth flow...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  try {
    // Step 1: Test registration
    console.log('1. Testing registration...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { display_name: 'Test User' }
      }
    });
    
    if (signUpError) {
      console.log('❌ Registration error:', signUpError.message);
      return false;
    }
    
    console.log('✅ Registration successful');
    console.log('📧 User created:', signUpData.user?.email);
    console.log('🔑 Session created:', signUpData.session ? 'YES' : 'NO');
    
    // Step 2: Check if email confirmation is required
    if (!signUpData.session) {
      console.log('⚠️  Email confirmation required - user not logged in');
      console.log('📋 SOLUTION: Disable email confirmation in Supabase');
      console.log('1. Go to: https://njgsuadqylclghesoavg.supabase.co/project/auth/settings');
      console.log('2. Find: "Enable email confirmations"');
      console.log('3. Toggle: OFF');
      console.log('4. Save');
    }
    
    // Step 3: Test login with the same credentials
    console.log('2. Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.log('❌ Login error:', signInError.message);
      return false;
    }
    
    console.log('✅ Login successful');
    console.log('👤 User ID:', signInData.user?.id);
    console.log('🔐 Session active:', signInData.session ? 'YES' : 'NO');
    
    return true;
    
  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
    return false;
  }
}

async function main() {
  const success = await testAuthFlow();
  
  if (success) {
    console.log('\n🎉 AUTH FLOW WORKING!');
    console.log('📱 Test registration: http://localhost:3001/register');
  } else {
    console.log('\n⚠️  AUTH FLOW ISSUE DETECTED');
    console.log('🔧 Most likely cause: Email confirmation required');
    console.log('📋 Fix: Disable email confirmations in Supabase Auth settings');
  }
}

main();
