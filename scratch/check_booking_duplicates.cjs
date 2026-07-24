const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  try {
    const resultsPath = path.join(__dirname, 'duplicate_audit_results.json');
    const duplicates = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const duplicateUserIds = [];
    duplicates.forEach(group => {
      group.users.forEach(u => {
        duplicateUserIds.push(u.id);
      });
    });

    console.log(`Checking bookings for ${duplicateUserIds.length} duplicate user IDs...`);

    const { data: bookings, error } = await supabase
      .from('website_store_pundit_bookings')
      .select('*');

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    console.log(`Total bookings found: ${bookings.length}`);

    const matchingDevotees = bookings.filter(b => duplicateUserIds.includes(b.user_id));
    const matchingPundits = bookings.filter(b => duplicateUserIds.includes(b.pundit_id));

    console.log(`Devotee bookings for duplicate users: ${matchingDevotees.length}`);
    console.log(`Pundit bookings for duplicate users: ${matchingPundits.length}`);

    matchingDevotees.forEach(b => {
      console.log(`- Devotee Booking: ${b.id} | User ID: ${b.user_id} | Puja: ${b.puja_name}`);
    });

    matchingPundits.forEach(b => {
      console.log(`- Pundit Booking: ${b.id} | Pundit ID: ${b.pundit_id} | Puja: ${b.puja_name}`);
    });

  } catch (err) {
    console.error('Exception checking bookings:', err);
  }
}

run();
