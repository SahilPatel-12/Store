import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3dtZWZkdXRsdHdjY3Bnbm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0MDE2OSwiZXhwIjoyMDk1NTE2MTY5fQ.9PIi4ccfQgaRD-AasEW40Z2nLsF3JD0SVCpGvJrXduc';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  const { data: o, error } = await supabase
    .from('website_store_orders')
    .select('*')
    .eq('order_id', 'MANTRA-689646')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Website Order detail:', o);
  }
}

test();
