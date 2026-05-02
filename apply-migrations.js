// Apply database migrations to Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://njgsuadqylclghesoavg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NEFGcnZvNUZICl-1Myu74g_bFgx6UyS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  try {
    console.log('Applying database migrations...');
    
    // Read the main migration file
    const migrationPath = __dirname + '/supabase/migrations/20260319053552_33e85bdc-4f95-4fda-ad2f-89d7928fa23c.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL loaded. Please apply this SQL in your Supabase SQL editor:');
    console.log('=====================================');
    console.log(migrationSQL);
    console.log('=====================================');
    console.log('Go to: https://njgsuadqylclghesoavg.supabase.co/project/sql');
    
  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

applyMigrations();
