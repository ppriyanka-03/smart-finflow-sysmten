// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection
supabase.from('profiles').select('count').then(result => {
  console.log('Connection test result:', result);
}).catch(error => {
  console.error('Connection test error:', error);
});
