import { supabaseAdmin } from '../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { items, shippingAddress, paymentMethod, couponCode, checkoutAttemptId, sessionToken } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress || !checkoutAttemptId || !sessionToken) {
    return res.status(400).json({ error: 'Missing required checkout parameters.' });
  }

  try {
    // 1. Verify Devotee Session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      return res.status(401).json({ error: 'Unauthorized devotee session.' });
    }

    const userId = sessionData.user_id;

    // 2. Check Idempotency Key
    const { data: existingOrder } = await supabaseAdmin
      .from('website_store_orders')
      .select('*')
      .eq('checkout_attempt_id', checkoutAttemptId)
      .maybeSingle();

    if (existingOrder) {
      if (existingOrder.user_id !== userId) {
        return res.status(403).json({ error: 'Idempotency conflict: attempt ID belongs to another customer session.' });
      }
      console.log(`[Idempotency] Returning existing order for attempt: ${checkoutAttemptId}`);
      return res.status(200).json({
        success: true,
        orderId: existingOrder.order_id,
        subtotal: Number(existingOrder.subtotal),
        discount: Number(existingOrder.discount),
        shipping: Number(existingOrder.shipping),
        tax: Number(existingOrder.tax),
        total: Number(existingOrder.total)
      });
    }

    // 3. Fetch tax and delivery settings
    const { data: settingsData } = await supabaseAdmin
      .from('website_settings')
      .select('value')
      .eq('key', 'tax_delivery_settings')
      .single();

    const settings = settingsData?.value || { global_gst_percent: 8, global_delivery_charge: 49, free_delivery_threshold: 999 };

    // 4. Fetch catalog products to confirm pricing and availability
    const productIds = items.map(item => item.productId);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('website_pooja_products')
      .select('*')
      .in('id', productIds);

    if (productsError || !products || products.length !== productIds.length) {
      return res.status(400).json({ error: 'Invalid checkout products. One or more products were not found.' });
    }

    // Confirm availability
    for (const prod of products) {
      if (!prod.is_published || !prod.in_stock) {
        return res.status(400).json({ error: `Product "${prod.name}" is currently unavailable.` });
      }
    }

    // 5. Authoritative Price Recalculation (Integer Paise Arithmetic)
    let subtotalPaise = 0;
    const dbItems = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const pricePaise = Math.round(Number(prod.price) * 100);
      subtotalPaise += pricePaise * item.quantity;

      return {
        product: {
          id: prod.id,
          name: prod.name,
          price: Number(prod.price),
          image: prod.image,
          slug: prod.slug,
          gstOverrideEnabled: prod.gst_override_enabled,
          customGst: prod.custom_gst,
          deliveryOverrideEnabled: prod.delivery_override_enabled,
          customDelivery: prod.custom_delivery
        },
        quantity: item.quantity
      };
    });

    // Coupon verification
    let discountPercent = 0;
    if (couponCode) {
      const formattedCode = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabaseAdmin
        .from('website_store_coupons')
        .select('*')
        .eq('code', formattedCode)
        .single();

      if (coupon) {
        const isNotExpired = !coupon.expiry_date || new Date(coupon.expiry_date) > new Date();
        const hasUsesLeft = !coupon.user_limit || coupon.redemptions_count < coupon.user_limit;

        if (isNotExpired && hasUsesLeft) {
          discountPercent = coupon.discount_percent;

          // Record coupon redemption
          await supabaseAdmin
            .from('website_store_coupon_redemptions')
            .insert({
              user_id: userId,
              coupon_id: coupon.id,
              order_id: null // Will be linked below
            });

          await supabaseAdmin
            .from('website_store_coupons')
            .update({ redemptions_count: coupon.redemptions_count + 1 })
            .eq('id', coupon.id);
        }
      }
    }

    const discountAmountPaise = Math.round(subtotalPaise * (discountPercent / 100));

    // Shipping calculations (paise)
    const maxDeliveryPaise = Math.max(...dbItems.map(item => {
      const p = item.product;
      return p.deliveryOverrideEnabled && p.customDelivery !== undefined && p.customDelivery !== null
        ? Math.round(Number(p.customDelivery) * 100)
        : Math.round(Number(settings.global_delivery_charge) * 100);
    }));

    const discountedSubtotalPaise = subtotalPaise - discountAmountPaise;
    const thresholdPaise = Math.round(Number(settings.free_delivery_threshold) * 100);
    const shippingCostPaise = discountedSubtotalPaise >= thresholdPaise ? 0 : maxDeliveryPaise;

    // Tax calculation (paise)
    let taxTotalPaise = 0;
    dbItems.forEach(item => {
      const p = item.product;
      const itemSubtotalPaise = Math.round(Number(p.price) * 100) * item.quantity;
      const itemDiscountedPaise = Math.round(itemSubtotalPaise * (1 - discountPercent / 100));
      const gstPercent = p.gstOverrideEnabled && p.customGst !== undefined && p.customGst !== null
        ? Number(p.customGst)
        : Number(settings.global_gst_percent);

      taxTotalPaise += Math.round(itemDiscountedPaise * (gstPercent / 100));
    });

    const finalTotalPaise = discountedSubtotalPaise + shippingCostPaise + taxTotalPaise;

    // 6. Generate Unique Order ID
    const uniqueNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `MANTRA-${uniqueNum}`;

    const isCod = paymentMethod === 'COD' || paymentMethod === 'Cash on Delivery';
    const initialStatus = isCod ? 'Being Packed' : 'Payment Pending';
    const paymentProvider = paymentMethod === 'Razorpay' ? 'razorpay' : (isCod ? 'cod' : 'manual_upi');
    const codFee = isCod ? Number(req.body.codFee || 0) : 0;

    // 7. Secure Insertion into public.website_store_orders
    const orderPayload = {
      order_id: orderId,
      user_id: userId,
      items: dbItems,
      subtotal: subtotalPaise / 100,
      discount: discountAmountPaise / 100,
      discount_percent: discountPercent,
      shipping: shippingCostPaise / 100,
      tax: taxTotalPaise / 100,
      total: (finalTotalPaise / 100) + codFee,
      payment_method: paymentMethod,
      delivery_city: shippingAddress.city,
      delivery_state: shippingAddress.state,
      full_name: shippingAddress.fullName,
      email: shippingAddress.email,
      address_line1: shippingAddress.addressLine1,
      address_line2: shippingAddress.addressLine2 || null,
      pincode: shippingAddress.pincode,
      phone_number: shippingAddress.phoneNumber,
      status: initialStatus,
      payment_status: 'Pending',
      payment_screenshot: req.body.paymentScreenshot || null,
      payment_provider: paymentProvider,
      cod_fee: codFee,
      checkout_attempt_id: checkoutAttemptId,
      gst_percent_snapshot: settings.global_gst_percent,
      gst_amount_snapshot: taxTotalPaise / 100,
      delivery_amount_snapshot: shippingCostPaise / 100,
      free_delivery_eligible_snapshot: discountedSubtotalPaise >= thresholdPaise
    };

    let insertedOrder;
    let { data, error: insertError } = await supabaseAdmin
      .from('website_store_orders')
      .insert(orderPayload)
      .select('*')
      .single();

    if (insertError && insertError.message && insertError.message.includes('cod_fee')) {
      console.warn('[Create Order] cod_fee column missing in website_store_orders, retrying without cod_fee column...');
      delete orderPayload.cod_fee;
      const retryRes = await supabaseAdmin
        .from('website_store_orders')
        .insert(orderPayload)
        .select('*')
        .single();
      data = retryRes.data;
      insertError = retryRes.error;
    }

    if (insertError) {
      console.error('[Create Order] DB Insert Error:', insertError);
      throw insertError;
    }

    insertedOrder = data;

    // Link coupon redemption to created order_id
    if (couponCode) {
      await supabaseAdmin
        .from('website_store_coupon_redemptions')
        .update({ order_id: orderId })
        .eq('user_id', userId)
        .is('order_id', null);
    }

    return res.status(200).json({
      success: true,
      orderId: insertedOrder.order_id,
      subtotal: Number(insertedOrder.subtotal),
      discount: Number(insertedOrder.discount),
      shipping: Number(insertedOrder.shipping),
      tax: Number(insertedOrder.tax),
      total: Number(insertedOrder.total)
    });
  } catch (err) {
    console.error('[Create Order] Exception:', err);
    return res.status(500).json({ error: 'Order creation failed on backend server: ' + err.message });
  }
}
