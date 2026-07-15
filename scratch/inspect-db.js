import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually from .env.local
function loadEnv() {
  const filePath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const index = trimmed.indexOf('=');
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function checkCounts() {
  console.log('--- Checking Supabase Database Counts (Anon Client) ---');
  
  // 1. Products
  try {
    const { data, count, error } = await supabase
      .from('website_pooja_products')
      .select('*', { count: 'exact', head: true });
    
    const { count: pubCount } = await supabase
      .from('website_pooja_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    console.log(`website_pooja_products: Total = ${count}, Published = ${pubCount}, Error = ${error ? JSON.stringify(error) : 'None'}`);
  } catch (err) {
    console.error('Error fetching website_pooja_products:', err);
  }

  // 2. Categories
  try {
    const { data, error } = await supabase
      .from('website_pooja_products')
      .select('category')
      .eq('is_published', true);
    if (data) {
      const cats = Array.from(new Set(data.map(item => item.category).filter(Boolean)));
      console.log(`website_pooja_products Categories: Unique count = ${cats.length}, List = ${JSON.stringify(cats)}`);
    } else {
      console.log(`website_pooja_products Categories: Error = ${JSON.stringify(error)}`);
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }

  // 3. Pundits (using table names from sitemap.ts)
  // sitemap.ts queries 'website_store_pundits'
  try {
    const { count, error } = await supabase
      .from('website_store_pundits')
      .select('*', { count: 'exact', head: true });
    
    const { count: approvedCount } = await supabase
      .from('website_store_pundits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    console.log(`website_store_pundits: Total = ${count}, Approved = ${approvedCount}, Error = ${error ? JSON.stringify(error) : 'None'}`);
  } catch (err) {
    console.error('Error fetching website_store_pundits:', err);
  }

  // Let's also check website_pundits (the table from seo-registry.ts)
  try {
    const { count, error } = await supabase
      .from('website_pundits')
      .select('*', { count: 'exact', head: true });
    console.log(`website_pundits: Total = ${count}, Error = ${error ? JSON.stringify(error) : 'None'}`);
  } catch (err) {
    console.error('Error fetching website_pundits:', err);
  }

  // 4. Dynamic Tables Fallback
  const candidateTables = [
    'website_store_blogs', 'website_blogs', 'blogs', 'posts',
    'website_store_collections', 'website_collections', 'collections',
    'website_store_brands', 'website_brands', 'brands',
    'website_store_articles', 'website_articles', 'articles',
    'website_store_festivals', 'website_festivals', 'festivals',
    'website_store_pujas', 'website_pujas', 'pujas'
  ];

  console.log('\n--- Checking Fallback/Candidate Tables ---');
  for (const table of candidateTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) {
        console.log(`- ${table}: Count = ${count}`);
      } else {
        // console.log(`- ${table}: Error = ${error.message}`);
      }
    } catch (e) {
      // Ignored
    }
  }

  if (supabaseAdmin) {
    console.log('\n--- Checking Supabase Database Counts (Admin Client) ---');
    try {
      const { count, error } = await supabaseAdmin
        .from('website_pooja_products')
        .select('*', { count: 'exact', head: true });
      console.log(`website_pooja_products (Admin): Total = ${count}, Error = ${error ? JSON.stringify(error) : 'None'}`);
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
  }
}

checkCounts().catch(console.error);
