import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { verifyAdmin, verifyCsrf, injectSecurityHeaders, logAdminAction } from '../_lib/admin/auth.js';
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

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  // 1. Verify Session
  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  // 2. GET request: List all orders
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('website_store_orders')
        .select('*')
        .or('status.neq.Payment Pending,payment_method.eq.COD,payment_method.eq.Cash on Delivery')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('[Admin Orders API GET Error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve orders list.' });
    }
  }

  // 3. POST request: Mutations (Requires CSRF protection)
  if (req.method === 'POST') {
    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: 'Forbidden: CSRF verification failed.' });
    }

    const { action, orderId, orderIds, status } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter.' });
    }
    if (action !== 'delete-orders' && !orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter.' });
    }

    try {
      if (action === 'update-delivery-status') {
        const allowedStatuses = ['Being Packed', 'Shipped', 'Delivered', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ error: `Invalid order status. Must be one of: ${allowedStatuses.join(', ')}` });
        }

        const { data: updatedOrder, error: updateErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({ status })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (updateErr) throw updateErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_UPDATE_STATUS', { orderId, status });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'confirm-legacy-payment') {
        const { data: updatedOrder, error: confirmErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({
            payment_status: 'Confirmed',
            status: 'Being Packed',
            payment_verified_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (confirmErr) throw confirmErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_CONFIRM_PAYMENT', { orderId });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'decline-legacy-payment') {
        const { data: updatedOrder, error: declineErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({
            payment_status: 'Failed',
            status: 'Cancelled',
            payment_verified_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (declineErr) throw declineErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_DECLINE_PAYMENT', { orderId });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'delete-orders') {
        const { orderIds, password } = req.body;
        const targetIds = Array.isArray(orderIds) ? orderIds : (req.body.orderId ? [req.body.orderId] : []);
        if (targetIds.length === 0) {
          return res.status(400).json({ error: 'No order IDs specified for deletion.' });
        }

        if (!password) {
          return res.status(400).json({ error: 'Super Admin password is required to delete orders.' });
        }

        // Fetch active admin users to verify password against Super Admin accounts
        const { data: adminUsers, error: adminErr } = await supabaseAdmin
          .from('website_store_admin')
          .select('*')
          .neq('is_active', false);

        if (adminErr || !adminUsers || adminUsers.length === 0) {
          return res.status(500).json({ error: 'Failed to verify admin credentials.' });
        }

        let isAuthorized = false;
        for (const u of adminUsers) {
          const storedHash = u.password_hash || '';
          const parts = storedHash.split('$');
          if (parts[0] === 'scrypt') {
            const salt = parts[1];
            const keyHex = parts[2];
            const derivedKey = await scrypt(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
            if (safeCompare(derivedKey.toString('hex'), keyHex)) {
              isAuthorized = true;
              break;
            }
          }
        }

        if (!isAuthorized) {
          return res.status(401).json({ error: 'Incorrect Super Admin password. Deletion unauthorized.' });
        }

        // Delete from public.order_items, public.shipping_addresses, and public.orders (Mobile App tables)
        try {
          await supabaseAdmin.from('order_items').delete().in('order_id', targetIds);
          await supabaseAdmin.from('shipping_addresses').delete().in('order_id', targetIds);
          await supabaseAdmin.from('orders').delete().in('id', targetIds);
        } catch (syncErr) {
          console.warn('[Admin Delete Orders] Error purging shared public.orders:', syncErr);
        }

        // Delete from website_store_orders
        const { data: deletedOrders, error: deleteErr } = await supabaseAdmin
          .from('website_store_orders')
          .delete()
          .in('order_id', targetIds)
          .select('order_id');

        if (deleteErr) {
          console.error('[Admin Delete Orders] DB Delete Error:', deleteErr);
          throw deleteErr;
        }

        await logAdminAction(adminSession.admin_id, req, 'ORDER_DELETE', { count: targetIds.length, targetIds });
        return res.status(200).json({ success: true, count: targetIds.length, deletedOrderIds: targetIds });
      }

      return res.status(400).json({ error: `Invalid action "${action}"` });
    } catch (err) {
      console.error('[Admin Orders API POST Error]:', err);
      return res.status(500).json({ error: 'Order update failed: ' + err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
