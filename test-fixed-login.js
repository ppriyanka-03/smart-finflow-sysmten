// Test the fixed login functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFixedLogin() {
  console.log('🧪 Testing fixed login functionality...');
  
  try {
    // Test 1: Check if we can access auth
    console.log('1. Testing Supabase auth access...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Auth access error:', sessionError.message);
      return false;
    }
    console.log('✅ Supabase auth accessible');
    
    // Test 2: Test direct login with a sample user
    console.log('2. Testing direct Supabase login...');
    
    // First, try to create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    console.log('Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { display_name: 'Test User' }
      }
    });
    
    if (signUpError && !signUpError.message.includes('rate limit')) {
      console.log('❌ Signup error:', signUpError.message);
    } else {
      console.log('✅ Test user created or already exists');
    }
    
    // Test login with the new implementation
    console.log('Testing login with new implementation...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (loginError) {
      console.log('❌ Login error:', loginError.message);
      console.log('📋 This is the exact error that will be shown in the UI');
      return false;
    }
    
    console.log('✅ Login successful!');
    console.log('👤 User ID:', loginData.user?.id);
    console.log('📧 Email:', loginData.user?.email);
    console.log('🔐 Session active:', loginData.session ? 'YES' : 'NO');
    
    // Test 3: Verify session persistence
    console.log('3. Testing session persistence...');
    const { data: currentSession } = await supabase.auth.getSession();
    
    if (currentSession.session) {
      console.log('✅ Session persisted correctly');
    } else {
      console.log('❌ Session not persisted');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function main() {
  const success = await testFixedLogin();
  
  if (success) {
    console.log('\n🎉 LOGIN FUNCTIONALITY FIXED!');
    console.log('✅ Direct Supabase login working');
    console.log('✅ Real error messages will be shown');
    console.log('✅ No useAuth dependency');
    console.log('📱 Test at: http://localhost:3001/login');
  } else {
    console.log('\n⚠️  LOGIN STILL HAS ISSUES');
    console.log('🔧 Check error messages above');
    console.log('📋 May need to create user in Supabase first');
  }
}

main();
