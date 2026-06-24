import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://vjkwmefdutltwccpgnny.supabase.co', 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L');
try {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: 'SELECT 1;'
  });
  console.log('Result:', data, 'Error:', error);
} catch (e) {
  console.log('Exception:', e.message);
}
