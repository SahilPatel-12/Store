import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client;

if (process.env.TESTING === 'true') {
  client = {
    from(table) {
      const builder = {
        table,
        filters: [],
        updateData: null,
        insertData: null,
        select(fields) {
          return this;
        },
        eq(col, val) {
          this.filters.push({ type: 'eq', col, val });
          return this;
        },
        neq(col, val) {
          this.filters.push({ type: 'neq', col, val });
          return this;
        },
        gt(col, val) {
          this.filters.push({ type: 'gt', col, val });
          return this;
        },
        limit(val) {
          return this;
        },
        update(data) {
          this.updateData = data;
          return this;
        },
        insert(data) {
          this.insertData = data;
          return this;
        },
        upsert(data) {
          this.insertData = data;
          return this;
        },
        async single() {
          const handler = global.__SUPABASE_MOCK__?.[this.table] || (() => ({ data: null, error: null }));
          return handler('single', this.filters, this.updateData || this.insertData);
        },
        async maybeSingle() {
          const handler = global.__SUPABASE_MOCK__?.[this.table] || (() => ({ data: null, error: null }));
          return handler('maybeSingle', this.filters, this.updateData || this.insertData);
        },
        async selectData() {
          const handler = global.__SUPABASE_MOCK__?.[this.table] || (() => ({ data: [], error: null }));
          return handler('select', this.filters, this.updateData || this.insertData);
        },
        then(resolve) {
          const handler = global.__SUPABASE_MOCK__?.[this.table] || (() => ({ data: null, error: null }));
          resolve(handler('execute', this.filters, this.updateData || this.insertData));
        }
      };
      return builder;
    }
  };
} else {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase url or Service Role Key is missing in server environment variables.');
  }
  client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export const supabaseAdmin = client;
