import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Ensure .env.local is present in the root folder and configured correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
