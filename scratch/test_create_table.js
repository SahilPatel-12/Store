import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://vjkwmefdutltwccpgnny.supabase.co', 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L');
try {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: 'CREATE TABLE IF NOT EXISTS public.website_store_pundits_test (id uuid PRIMARY KEY);'
  });
  console.log('Result:', data, 'Error:', error);
} catch (e) {
  console.log('Exception:', e.message);
}
