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

async function syncOrderStatusToPublicOrders(orderId, websiteStatus, websitePaymentStatus) {
  try {
    const { data: addressRecord } = await supabaseAdmin
      .from('shipping_addresses')
      .select('order_id')
      .like('address_line_2', `%${orderId}%`)
      .maybeSingle();

    if (addressRecord?.order_id) {
      const updateData = {};
      if (websiteStatus) {
        if (websiteStatus === 'Being Packed') {
          updateData.order_status = 'Confirmed';
        } else if (websiteStatus === 'Shipped') {
          updateData.order_status = 'Shipped';
        } else if (websiteStatus === 'Delivered') {
          updateData.order_status = 'Delivered';
        } else if (websiteStatus === 'Cancelled') {
          updateData.order_status = 'Cancelled';
        }
      }
      if (websitePaymentStatus) {
        if (websitePaymentStatus === 'Confirmed' || websitePaymentStatus === 'Paid') {
          updateData.payment_status = 'completed';
        } else if (websitePaymentStatus === 'Failed') {
          updateData.payment_status = 'failed';
        }
      }

      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin
          .from('orders')
          .update(updateData)
          .eq('id', addressRecord.order_id);
      }
    }
  } catch (err) {
    console.warn('[Sync Status] Failed to update public.orders:', err);
  }
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, orders: data });
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

        // Sync status to public.orders for React Native Mobile App
        await syncOrderStatusToPublicOrders(orderId, status);

        await logAdminAction(adminSession.admin_id, req, 'ORDER_UPDATE_STATUS', { orderId, status });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'confirm-legacy-payment') {
        const { password } = req.body;
        
        // Fetch order details to check if it's COD
        const { data: orderToCheck, error: fetchErr } = await supabaseAdmin
          .from('website_store_orders')
          .select('payment_method')
          .eq('order_id', orderId)
          .single();
          
        if (fetchErr) throw fetchErr;
        
        const isCod = orderToCheck && (orderToCheck.payment_method === 'COD' || orderToCheck.payment_method === 'Cash on Delivery');
        if (isCod) {
          if (!password) {
            return res.status(400).json({ error: 'Super Admin password is required to confirm COD orders.' });
          }
          const isAuthorized = await verifySuperAdminPassword(password);
          if (!isAuthorized) {
            return res.status(401).json({ error: 'Incorrect Super Admin password. Action unauthorized.' });
          }
        }

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

        // Sync payment and status to public.orders for React Native Mobile App
        await syncOrderStatusToPublicOrders(orderId, 'Being Packed', 'Confirmed');

        await logAdminAction(adminSession.admin_id, req, 'ORDER_CONFIRM_PAYMENT', { orderId });
        return res.status(200).json({ success: true, order: updatedOrder });
      }

      if (action === 'revert-legacy-payment') {
        const { password } = req.body;
        
        // Fetch order details to check if it's COD
        const { data: orderToCheck, error: fetchErr } = await supabaseAdmin
          .from('website_store_orders')
          .select('payment_method')
          .eq('order_id', orderId)
          .single();
          
        if (fetchErr) throw fetchErr;
        
        const isCod = orderToCheck && (orderToCheck.payment_method === 'COD' || orderToCheck.payment_method === 'Cash on Delivery');
        if (isCod) {
          if (!password) {
            return res.status(400).json({ error: 'Super Admin password is required to revert COD orders.' });
          }
          const isAuthorized = await verifySuperAdminPassword(password);
          if (!isAuthorized) {
            return res.status(401).json({ error: 'Incorrect Super Admin password. Action unauthorized.' });
          }
        }

        const { data: updatedOrder, error: revertErr } = await supabaseAdmin
          .from('website_store_orders')
          .update({
            payment_status: 'Pending',
            payment_verified_at: null
          })
          .eq('order_id', orderId)
          .select('*')
          .single();

        if (revertErr) throw revertErr;

        // Sync payment and status to public.orders for React Native Mobile App
        await syncOrderStatusToPublicOrders(orderId, updatedOrder.status, 'Pending');

        await logAdminAction(adminSession.admin_id, req, 'ORDER_REVERT_PAYMENT', { orderId });
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

        // Sync decline and cancellation to public.orders for React Native Mobile App
        await syncOrderStatusToPublicOrders(orderId, 'Cancelled', 'Failed');

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
          // Look up matching public.orders UUIDs by matching the human-friendly website orderId in shipping_addresses.address_line_2
          const matchUuids = [];
          for (const orderId of targetIds) {
            const { data: addressRecords } = await supabaseAdmin
              .from('shipping_addresses')
              .select('order_id')
              .like('address_line_2', `%${orderId}%`);
            
            if (addressRecords && addressRecords.length > 0) {
              addressRecords.forEach(r => {
                if (r.order_id) matchUuids.push(r.order_id);
              });
            }
          }

          if (matchUuids.length > 0) {
            // Delete child records first, then delete orders using matched UUIDs
            await supabaseAdmin.from('order_items').delete().in('order_id', matchUuids);
            await supabaseAdmin.from('shipping_addresses').delete().in('order_id', matchUuids);
            await supabaseAdmin.from('orders').delete().in('id', matchUuids);
          }
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
