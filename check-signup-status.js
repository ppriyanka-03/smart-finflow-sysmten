// Check signup status and provide direct fix
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSignupStatus() {
  console.log('🔍 Checking signup status...');
  
  try {
    // Test signup with a temporary email
    const testEmail = `test-${Date.now()}@check.com`;
    const testPassword = 'Test123456!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { display_name: 'Test User' }
      }
    });
    
    if (error) {
      if (error.message.includes('signups are disabled')) {
        console.log('❌ SIGNUPS DISABLED');
        console.log('\n🔧 IMMEDIATE FIX:');
        console.log('1. Open: https://njgsuadqylclghesoavg.supabase.co/project/auth/settings');
        console.log('2. Find: "Allow new users to sign up"');
        console.log('3. Toggle: ON');
        console.log('4. Click: Save');
        console.log('\n📱 Then test: http://localhost:4000');
        return false;
      } else if (error.message.includes('User already registered')) {
        console.log('✅ SIGNUPS ENABLED (user exists)');
        return true;
      } else {
        console.log('❌ Other error:', error.message);
        return false;
      }
    }
    
    if (data.user && !data.session) {
      console.log('✅ SIGNUPS ENABLED (email confirmation needed)');
      return true;
    }
    
    console.log('✅ SIGNUPS ENABLED');
    return true;
    
  } catch (err) {
    console.error('❌ Check failed:', err);
    return false;
  }
}

async function main() {
  const signupEnabled = await checkSignupStatus();
  
  if (signupEnabled) {
    console.log('\n🎉 SIGNUPS WORKING!');
    console.log('📱 Test registration: http://localhost:4000/register');
  } else {
    console.log('\n⚠️  SIGNUPS DISABLED - Fix required');
    console.log('🔧 See instructions above');
  }
}

main();
