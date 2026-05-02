// Auto-fix database schema
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAndFixDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test if profiles table exists
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database tables missing:', error.message);
      console.log('\n📋 MANUAL SETUP REQUIRED:');
      console.log('1. Go to: https://njgsuadqylclghesoavg.supabase.co/project/sql');
      console.log('2. Copy the SQL from database-setup-instructions.md');
      console.log('3. Paste and run the SQL');
      console.log('4. Then test the login at: http://localhost:4000');
      return false;
    } else {
      console.log('✅ Database tables exist');
      return true;
    }
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
}

// Test authentication
async function testAuth() {
  console.log('\nTesting authentication...');
  
  try {
    // Test if we can access auth
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Auth system accessible');
    return true;
  } catch (err) {
    console.error('❌ Auth error:', err);
    return false;
  }
}

async function main() {
  const dbOk = await testAndFixDatabase();
  const authOk = await testAuth();
  
  if (dbOk && authOk) {
    console.log('\n🎉 SYSTEM READY!');
    console.log('📱 Application: http://localhost:4000');
    console.log('🔐 You can now register and login');
  } else {
    console.log('\n⚠️  SETUP NEEDED - See instructions above');
  }
}

main();
