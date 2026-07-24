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
    console.log('Fetching all website store users...');
    const { data: users, error } = await supabase
      .from('website_store_users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`Total users found: ${users.length}`);

    // Helper to normalize phone number to 10 digits
    function getNormalizedPhone(phone) {
      if (!phone) return null;
      const clean = phone.replace(/[^\d]/g, '');
      if (clean.length === 10) return clean;
      if (clean.length === 12 && clean.startsWith('91')) {
        return clean.substring(2);
      }
      // If it has +91 or other stuff, strip it
      if (clean.length > 10) {
        return clean.slice(-10);
      }
      return clean;
    }

    // Group by normalized phone
    const phoneGroups = {};
    users.forEach(u => {
      const norm = getNormalizedPhone(u.phone_number);
      if (!norm) return;
      if (!phoneGroups[norm]) {
        phoneGroups[norm] = [];
      }
      phoneGroups[norm].push(u);
    });

    const duplicates = {};
    let duplicateGroupsCount = 0;
    let totalDuplicateUsers = 0;

    Object.keys(phoneGroups).forEach(norm => {
      const group = phoneGroups[norm];
      if (group.length > 1) {
        duplicates[norm] = group;
        duplicateGroupsCount++;
        totalDuplicateUsers += group.length;
      }
    });

    console.log(`Found ${duplicateGroupsCount} groups of duplicate phone numbers (Total ${totalDuplicateUsers} user records involved).`);

    // We will analyze business data for ALL users in duplicate groups
    const analysis = [];

    for (const [normPhone, group] of Object.entries(duplicates)) {
      const groupDetails = {
        normalizedPhone: normPhone,
        users: []
      };

      for (const u of group) {
        // Query related business records for this user ID
        const [orders, addresses, sessions, affiliates, couponRedemptions, devoteeBookings, punditBookings] = await Promise.all([
          supabase.from('website_store_orders').select('id, order_id, total, status, created_at').eq('user_id', u.id),
          supabase.from('website_store_addresses').select('id, city, state').eq('user_id', u.id),
          supabase.from('user_sessions').select('id, expires_at').eq('user_id', u.id),
          supabase.from('website_store_affiliates').select('id, code, enabled').eq('user_id', u.id),
          supabase.from('website_store_coupon_redemptions').select('id').eq('user_id', u.id),
          supabase.from('website_store_pundit_bookings').select('id, devotee_phone, status').eq('user_id', u.id),
          supabase.from('website_store_pundit_bookings').select('id, devotee_phone, status').eq('pundit_id', u.id)
        ]);

        groupDetails.users.push({
          id: u.id,
          rawPhone: u.phone_number,
          email: u.email,
          name: u.full_name,
          createdAt: u.created_at,
          lastLoginAt: u.last_login_at,
          isPundit: u.is_pundit,
          isSuspended: u.is_suspended,
          affiliateStatus: u.affiliate_status,
          affiliateCode: u.affiliate_code,
          counts: {
            orders: orders.data ? orders.data.length : 0,
            addresses: addresses.data ? addresses.data.length : 0,
            sessions: sessions.data ? sessions.data.length : 0,
            affiliates: affiliates.data ? affiliates.data.length : 0,
            couponRedemptions: couponRedemptions.data ? couponRedemptions.data.length : 0,
            devoteeBookings: devoteeBookings.data ? devoteeBookings.data.length : 0,
            punditBookings: punditBookings.data ? punditBookings.data.length : 0
          },
          details: {
            orders: orders.data || [],
            addresses: addresses.data || [],
            sessions: sessions.data || [],
            affiliates: affiliates.data || [],
            couponRedemptions: couponRedemptions.data || [],
            devoteeBookings: devoteeBookings.data || [],
            punditBookings: punditBookings.data || []
          }
        });
      }

      analysis.push(groupDetails);
    }

    const outputPath = path.join(__dirname, 'duplicate_audit_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`Duplicate users business data audit saved to ${outputPath}`);

  } catch (err) {
    console.error('Exception during audit:', err);
  }
}

run();
