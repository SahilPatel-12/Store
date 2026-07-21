import { supabase } from './supabase';

// Function to normalize phone number to E.164 (+91...)
export function normalizePhone(phoneStr: string | null | undefined): string | null {
  if (!phoneStr) return null;
  let digits = String(phoneStr).replace(/[^0-9]/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length > 10 && !phoneStr.startsWith('+')) return '+' + digits;
  return phoneStr;
}

// Fetch profile by Phone Number fallback
export async function fetchUserProfile(userPhone: string | null | undefined) {
  const normPhone = normalizePhone(userPhone);
  if (!normPhone) return null;

  try {
    // 1. Try querying profiles table by phone number
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`phone.eq.${normPhone},phone.eq.${normPhone.replace('+', '')}`)
      .maybeSingle();

    if (error) {
      console.warn('[crossPlatformSync] Error fetching user profile:', error);
      return null;
    }

    if (profile && profile.full_name) {
      return profile; // Returns full_name (e.g. "Sahil2")
    }
  } catch (err) {
    console.error('[crossPlatformSync] Failed to fetch user profile:', err);
  }
  return null;
}

export interface WebsiteCheckoutData {
  phone: string;
  orderType?: 'product' | 'puja' | string;
  totalAmount: number | string;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  shippingCost?: number | string;
  paymentStatus?: string;
  orderStatus?: string;
  items?: Array<{
    id?: string | number;
    productId?: string | number;
    item_type?: 'product' | 'puja' | string;
    quantity?: number;
    price: number | string;
  }>;
}

export async function handleWebsiteCheckout(
  checkoutData: WebsiteCheckoutData,
  webAuthUser?: { id: string } | null
) {
  const customerPhone = normalizePhone(checkoutData.phone);
  if (!customerPhone) {
    console.warn('[crossPlatformSync] Cannot handle website checkout: phone missing or invalid.');
    return null;
  }

  try {
    // 1. Look up app_users ID matching customer phone
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id')
      .or(`phone.eq.${customerPhone},phone.eq.${customerPhone.replace('+', '')}`)
      .maybeSingle();

    if (appUserError) {
      console.warn('[crossPlatformSync] Error querying app_users:', appUserError);
    }

    // Use appUser.id if found, else fallback to webAuthUser.id
    const targetUserId = appUser ? appUser.id : (webAuthUser?.id || null);

    const totalAmount = Number(checkoutData.totalAmount || 0);
    const subtotal = Number(checkoutData.subtotal !== undefined ? checkoutData.subtotal : totalAmount);
    const discount = Number(checkoutData.discount || 0);
    const tax = Number(checkoutData.tax || 0);
    const shippingCost = Number(checkoutData.shippingCost || 0);

    // 2. Insert order into shared public.orders table
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: targetUserId, // Links directly to mobile user!
        order_type: checkoutData.orderType || 'product', // 'product' or 'puja'
        total_amount: totalAmount,
        payment_status: checkoutData.paymentStatus || 'completed',
        order_status: checkoutData.orderStatus || 'Confirmed',
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        shipping_cost: shippingCost
      })
      .select()
      .single();

    if (error) {
      console.error('[crossPlatformSync] Error creating website order in public.orders:', error);
      throw error;
    }

    // 3. Insert order items if applicable
    if (checkoutData.items && checkoutData.items.length > 0) {
      const orderItems = checkoutData.items.map(item => ({
        order_id: order.id,
        item_type: item.item_type || 'product',
        item_id: String(item.id || item.productId || ''),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0)
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error('[crossPlatformSync] Error inserting order items into public.order_items:', itemsError);
      }
    }

    return order;
  } catch (err) {
    console.error('[crossPlatformSync] handleWebsiteCheckout failed:', err);
    return null;
  }
}
