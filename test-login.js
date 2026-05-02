// Test login functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('🧪 Testing login functionality...');
  
  try {
    // Test 1: Check if auth is working
    console.log('1. Testing auth system...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Auth system error:', sessionError.message);
      return false;
    }
    console.log('✅ Auth system working');
    
    // Test 2: Try to create a test user
    console.log('2. Creating test user...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: 'Test User'
        }
      }
    });
    
    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        console.log('⚠️  Test user already exists, trying login...');
      } else {
        console.log('❌ Signup error:', signUpError.message);
        return false;
      }
    } else {
      console.log('✅ Test user created:', testEmail);
    }
    
    // Test 3: Try to login
    console.log('3. Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.log('❌ Login error:', signInError.message);
      return false;
    }
    
    console.log('✅ Login successful!');
    console.log('📱 User ID:', signInData.user?.id);
    console.log('📧 Email:', signInData.user?.email);
    
    // Test 4: Test profiles table access
    console.log('4. Testing profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signInData.user?.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profiles table error:', profileError.message);
      console.log('📋 Database tables need to be created');
      return false;
    }
    
    console.log('✅ Profiles table working');
    console.log('👤 Profile:', profileData);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function main() {
  const success = await testLogin();
  
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('📱 Application is ready: http://localhost:4000');
    console.log('🔐 You can register and login normally');
  } else {
    console.log('\n⚠️  SETUP NEEDED');
    console.log('📋 Apply database schema first:');
    console.log('1. Open: http://localhost:4000/setup-database.html');
    console.log('2. Follow the instructions');
    console.log('3. Then test login at: http://localhost:4000');
  }
}

main();
