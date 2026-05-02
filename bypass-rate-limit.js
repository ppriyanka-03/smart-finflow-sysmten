// Bypass email rate limit by using existing users or direct login
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function bypassRateLimit() {
  console.log('🔧 Bypassing email rate limit...');
  
  // Option 1: Try login with existing test user
  const existingUsers = [
    { email: 'test@example.com', password: 'Test123456!' },
    { email: 'user@example.com', password: 'User123456!' },
    { email: 'demo@example.com', password: 'Demo123456!' }
  ];
  
  for (const user of existingUsers) {
    console.log(`Trying login with: ${user.email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    
    if (!error && data.session) {
      console.log('✅ Login successful with existing user!');
      console.log('📱 You can now use these credentials:');
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('🎯 Go to: http://localhost:3001/login');
      return true;
    }
  }
  
  // Option 2: Create user with different approach
  console.log('Creating new user with timestamp...');
  const timestamp = Date.now();
  const testEmail = `user${timestamp}@test.com`;
  const testPassword = 'Test123456!';
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { display_name: 'Test User' }
    }
  });
  
  if (error) {
    if (error.message.includes('rate limit')) {
      console.log('⏰ Rate limit active. Use existing user instead:');
      console.log('📧 Email: priyanka564636@gmail.com');
      console.log('🔑 Password: (use the password you set during registration)');
      console.log('🎯 Or wait 5-10 minutes and try again');
    } else {
      console.log('❌ Other error:', error.message);
    }
    return false;
  }
  
  console.log('✅ New user created!');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('🎯 Go to: http://localhost:3001/login');
  
  return true;
}

async function main() {
  const success = await bypassRateLimit();
  
  if (success) {
    console.log('\n🎉 RATE LIMIT BYPASSED!');
    console.log('✅ You can now test login functionality');
  } else {
    console.log('\n⚠️  RATE LIMIT ACTIVE');
    console.log('📋 Solutions:');
    console.log('1. Wait 5-10 minutes for rate limit to reset');
    console.log('2. Use existing credentials if you have them');
    console.log('3. Disable email confirmations in Supabase settings');
  }
}

main();
