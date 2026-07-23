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

// Validation & recalculation helper for Order Corrections
function validateAndCalculateCorrectionPayload(originalOrder, payload) {
  const {
    fullName,
    phoneNumber,
    email,
    addressLine1,
    addressLine2,
    deliveryCity,
    deliveryState,
    pincode,
    items,
    editReason
  } = payload;

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    throw new Error('Full Name is required and cannot be empty.');
  }

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Phone Number is required.');
  }
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  if (cleanPhone.length < 10) {
    throw new Error('Invalid Phone Number format.');
  }

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Invalid Email Address format.');
  }

  if (!addressLine1 || typeof addressLine1 !== 'string' || !addressLine1.trim()) {
    throw new Error('Address Line 1 is required.');
  }

  if (!deliveryCity || typeof deliveryCity !== 'string' || !deliveryCity.trim()) {
    throw new Error('City is required.');
  }

  if (!deliveryState || typeof deliveryState !== 'string' || !deliveryState.trim()) {
    throw new Error('State is required.');
  }

  if (!pincode || typeof pincode !== 'string') {
    throw new Error('Pincode is required.');
  }
  const cleanPincode = pincode.replace(/[^0-9]/g, '');
  if (cleanPincode.length !== 6) {
    throw new Error('Pincode must be exactly 6 digits.');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Corrected order must contain at least one item.');
  }

  const sanitizedItems = [];
  let subtotal = 0;

  for (const item of items) {
    if (!item || !item.product || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error('Each item must have a valid quantity greater than 0.');
    }

    const price = Number(item.product.price);
    if (isNaN(price) || price < 0) {
      throw new Error(`Invalid price for product "${item.product.name || item.product.id}".`);
    }

    subtotal += price * item.quantity;
    sanitizedItems.push({
      product: { ...item.product },
      quantity: item.quantity
    });
  }

  const discountPercent = Number(originalOrder.discount_percent || 0);
  const discount = Math.round((subtotal * (discountPercent / 100)) * 100) / 100;
  const discountedSubtotal = subtotal - discount;

  const freeDeliveryEligible = discountedSubtotal >= 999;
  let shipping = 0;
  if (!freeDeliveryEligible) {
    shipping = Number(originalOrder.delivery_amount_snapshot ?? originalOrder.shipping ?? 49);
  }

  let tax = 0;
  for (const item of sanitizedItems) {
    const p = item.product;
    const itemSubtotal = p.price * item.quantity;
    const itemDiscounted = itemSubtotal * (1 - discountPercent / 100);
    const gstPercent = (p.gstOverrideEnabled && p.customGst !== undefined && p.customGst !== null)
      ? Number(p.customGst)
      : Number(originalOrder.gst_percent_snapshot ?? 8);

    tax += itemDiscounted * (gstPercent / 100);
  }
  tax = Math.round(tax * 100) / 100;

  const isCod = originalOrder.payment_method === 'COD' || originalOrder.payment_method === 'Cash on Delivery';
  const totalQuantity = sanitizedItems.reduce((sum, i) => sum + i.quantity, 0);
  const codFee = isCod ? (50 * totalQuantity) : 0;

  const total = Math.max(0, Math.round((subtotal - discount + shipping + tax + codFee) * 100) / 100);

  return {
    full_name: fullName.trim(),
    phone_number: cleanPhone,
    email: email.trim(),
    address_line1: addressLine1.trim(),
    address_line2: addressLine2 ? addressLine2.trim() : null,
    delivery_city: deliveryCity.trim(),
    delivery_state: deliveryState.trim(),
    pincode: cleanPincode,
    items_snapshot: sanitizedItems,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    edit_reason: editReason ? editReason.trim() : null
  };
}

export default async function handler(req, res) {
  injectSecurityHeaders(res);

  // 1. Verify Session
  const adminSession = await verifyAdmin(req);
  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  // 2. GET request: List all orders or get order correction
  if (req.method === 'GET') {
    try {
      const { action, orderId } = req.query || {};
      if (action === 'get-correction' && orderId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        let q = supabaseAdmin.from('website_store_orders').select('id, order_id');
        if (isUuid) {
          q = q.or(`id.eq.${orderId},order_id.eq.${orderId}`);
        } else {
          q = q.eq('order_id', orderId);
        }
        const { data: ord } = await q.maybeSingle();

        if (!ord) {
          return res.status(404).json({ error: 'Order not found.' });
        }

        const { data: correction, error: corrErr } = await supabaseAdmin
          .from('order_corrections')
          .select('*')
          .eq('order_id', ord.id)
          .maybeSingle();

        if (corrErr) throw corrErr;
        return res.status(200).json({ success: true, correction });
      }

      let data;
      const { data: rawOrders, error } = await supabaseAdmin
        .from('website_store_orders')
        .select('*, order_corrections(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Admin Orders API] Relationship embedding fallback triggered:', error.message);
        
        const { data: simpleOrders, error: simpleErr } = await supabaseAdmin
          .from('website_store_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (simpleErr) throw simpleErr;

        try {
          const { data: corrections } = await supabaseAdmin
            .from('order_corrections')
            .select('*');

          if (corrections && corrections.length > 0) {
            const corrMap = new Map();
            corrections.forEach(c => corrMap.set(c.order_id, c));
            simpleOrders.forEach(o => {
              if (corrMap.has(o.id)) {
                o.order_corrections = corrMap.get(o.id);
              }
            });
          }
        } catch (corrErr) {
          console.warn('[Admin Orders API] order_corrections table fallback:', corrErr.message);
        }

        data = simpleOrders;
      } else {
        data = rawOrders;
      }

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
    if (action !== 'delete-orders' && action !== 'save-correction' && action !== 'update-correction' && !orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter.' });
    }

    try {
      if (action === 'save-correction' || action === 'update-correction') {
        const { orderId: targetOrderId, payload } = req.body;
        if (!targetOrderId || !payload) {
          return res.status(400).json({ error: 'Missing orderId or payload for correction.' });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetOrderId);
        let q = supabaseAdmin.from('website_store_orders').select('*');
        if (isUuid) {
          q = q.or(`id.eq.${targetOrderId},order_id.eq.${targetOrderId}`);
        } else {
          q = q.eq('order_id', targetOrderId);
        }
        const { data: origOrder, error: fetchErr } = await q.maybeSingle();

        if (fetchErr || !origOrder) {
          console.error('[Admin Save Correction Fetch Error]:', fetchErr);
          return res.status(404).json({ error: 'Original order not found.' });
        }

        const calculated = validateAndCalculateCorrectionPayload(origOrder, payload);
        calculated.order_id = origOrder.id;
        calculated.edited_by = adminSession.admin_id;
        calculated.updated_at = new Date().toISOString();

        const { data: savedCorrection, error: saveErr } = await supabaseAdmin
          .from('order_corrections')
          .upsert(calculated, { onConflict: 'order_id' })
          .select('*')
          .single();

        if (saveErr) {
          console.error('[Admin Save Correction Error]:', saveErr);
          throw saveErr;
        }

        await logAdminAction(adminSession.admin_id, req, 'ORDER_CORRECTION_SAVE', {
          orderId: origOrder.order_id,
          orderUuid: origOrder.id,
          total: savedCorrection.total
        });

        return res.status(200).json({ success: true, correction: savedCorrection });
      }

      if (action === 'delete-correction') {
        const { orderId: targetOrderId } = req.body;
        if (!targetOrderId) {
          return res.status(400).json({ error: 'Missing orderId parameter.' });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetOrderId);
        let q = supabaseAdmin.from('website_store_orders').select('id, order_id');
        if (isUuid) {
          q = q.or(`id.eq.${targetOrderId},order_id.eq.${targetOrderId}`);
        } else {
          q = q.eq('order_id', targetOrderId);
        }
        const { data: origOrder, error: fetchErr } = await q.maybeSingle();

        if (fetchErr || !origOrder) {
          return res.status(404).json({ error: 'Original order not found.' });
        }

        const { error: delErr } = await supabaseAdmin
          .from('order_corrections')
          .delete()
          .eq('order_id', origOrder.id);

        if (delErr) throw delErr;

        await logAdminAction(adminSession.admin_id, req, 'ORDER_CORRECTION_DELETE', {
          orderId: origOrder.order_id,
          orderUuid: origOrder.id
        });

        return res.status(200).json({ success: true, message: 'Correction removed. Original order restored.' });
      }

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
