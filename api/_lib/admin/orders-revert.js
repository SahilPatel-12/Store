import { verifyAdmin } from './auth.js';
import { supabaseAdmin } from '../supabase-admin.js';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function safeCompare(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

async function verifySuperAdminPassword(password) {
  if (!password) return false;
  const { data: adminUsers, error: adminErr } = await supabaseAdmin
    .from('website_store_admin')
    .select('*')
    .neq('is_active', false);

  if (adminErr || !adminUsers || adminUsers.length === 0) {
    return false;
  }

  for (const u of adminUsers) {
    const storedHash = u.password_hash || '';
    const parts = storedHash.split('$');
    if (parts[0] === 'scrypt') {
      const salt = parts[1];
      const keyHex = parts[2];
      const derivedKey = await scrypt(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
      if (safeCompare(derivedKey.toString('hex'), keyHex)) {
        return true;
      }
    }
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { orderId, password } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Missing order ID.' });
  }

  try {
    const isAdmin = !!(await verifyAdmin(req));
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
    }

    // 1. Fetch order details
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('website_store_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const isCod = order && (order.payment_method === 'COD' || order.payment_method === 'Cash on Delivery');
    if (isCod) {
      if (!password) {
        return res.status(400).json({ error: 'Super Admin password is required to revert COD orders.' });
      }
      const isAuthorized = await verifySuperAdminPassword(password);
      if (!isAuthorized) {
        return res.status(401).json({ error: 'Incorrect Super Admin password. Action unauthorized.' });
      }
    }

    // 2. Update order payment status to Pending, set packing status to initial (Being Packed for COD, Payment Pending for UPI)
    const newStatus = isCod ? 'Being Packed' : 'Payment Pending';
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('website_store_orders')
      .update({
        payment_status: 'Pending',
        status: newStatus,
        payment_verified_at: null
      })
      .eq('order_id', orderId)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    console.log(`[Admin Legacy Revert] Order ${orderId} reverted successfully by admin.`);
    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('[Admin Legacy Revert] Exception:', err);
    return res.status(500).json({ error: 'Failed to revert legacy order payment: ' + err.message });
  }
}
