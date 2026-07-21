import type { CartItem } from '../types';
import type { OrderDetails } from '../components/OrderSuccessPage';
import { loadRazorpayScript } from '../lib/razorpay';

interface UseRazorpayCheckoutProps {
  cart: CartItem[];
  discountPercent: number;
  appliedCouponCode: string;
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  taxDeliverySettings: {
    globalGstPercent: number;
    globalDeliveryCharge: number;
    freeDeliveryThreshold: number;
  };
  onOrderSuccess: (details: OrderDetails) => Promise<void> | void;
  onOrderComplete: () => void;
  setIsPlacingOrder: (loading: boolean) => void;
  setStep?: (step: any) => void;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
}

export function useRazorpayCheckout({
  cart,
  discountPercent,
  appliedCouponCode,
  fullName,
  phone,
  email,
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
  taxDeliverySettings,
  onOrderSuccess,
  onOrderComplete,
  setIsPlacingOrder,
  setStep,
  onPaymentSuccess,
  onPaymentCancel
}: UseRazorpayCheckoutProps) {

  const handleRazorpayPayment = async (checkoutAttemptId: string) => {
    setIsPlacingOrder(true);

    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay Checkout script. Check internet connectivity.');
      }

      const sessionToken = localStorage.getItem('session_token') || '';
      if (!sessionToken) {
        throw new Error('Customer session not found. Please log in.');
      }

      // 2. Create internal order in the database via Vercel serverless API
      const orderCreateRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          shippingAddress: {
            fullName,
            phoneNumber: phone,
            email: email || '',
            addressLine1,
            addressLine2: addressLine2 || '',
            city,
            state,
            pincode
          },
          paymentMethod: 'Razorpay',
          couponCode: appliedCouponCode || '',
          checkoutAttemptId,
          sessionToken,
          paymentScreenshot: null
        })
      });

      if (!orderCreateRes.ok) {
        const errJson = await orderCreateRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to place internal order: ${orderCreateRes.status}`);
      }

      const orderResult = await orderCreateRes.json();
      const internalOrderId = orderResult.orderId;

      // 3. Initiate Razorpay Order from server-only client configuration
      const rzOrderRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: internalOrderId,
          sessionToken
        })
      });

      if (!rzOrderRes.ok) {
        const errJson = await rzOrderRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create Razorpay Order.');
      }

      const rzData = await rzOrderRes.json();

      if (rzData.bypass) {
        // Direct success bypass for local test environment
        await onOrderSuccess({
          orderId: internalOrderId,
          items: cart,
          subtotal: orderResult.subtotal,
          discount: orderResult.discount,
          discountPercent,
          shipping: orderResult.shipping,
          tax: orderResult.tax,
          total: orderResult.total,
          paymentMethod: 'Razorpay',
          deliveryCity: city,
          deliveryState: state,
          fullName,
          email,
          phoneNumber: phone,
          addressLine1,
          addressLine2,
          pincode,
          placedAt: orderResult.placedAt ? new Date(orderResult.placedAt) : new Date(),
          razorpayPaymentId: 'rzp_bypass_mocked',
          appliedCouponCode: appliedCouponCode || undefined,
          paymentStatus: 'Confirmed',
          status: 'Being Packed',
          gstPercentSnapshot: taxDeliverySettings.globalGstPercent,
          gstAmountSnapshot: orderResult.tax,
          deliveryAmountSnapshot: orderResult.shipping,
          freeDeliveryEligibleSnapshot: (orderResult.subtotal - orderResult.discount) >= taxDeliverySettings.freeDeliveryThreshold
        });
        onOrderComplete();
        setIsPlacingOrder(false);
        return;
      }

      // 4. Trigger standard Razorpay Checkout Overlay
      const options = {
        key: rzData.keyId,
        amount: rzData.amount,
        currency: rzData.currency,
        name: 'Mantra Store',
        description: 'Secure Order Purchase',
        order_id: rzData.razorpayOrderId,
        handler: async function (response: any) {
          setIsPlacingOrder(true);
          try {
            // 5. Send tokens to Payment Verification API
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionToken,
                orderId: internalOrderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              const errJson = await verifyRes.json().catch(() => ({}));
              throw new Error(errJson.error || 'Verification signature mismatch.');
            }

            // 6. Complete flow locally and direct to Success state
            await onOrderSuccess({
              orderId: internalOrderId,
              items: cart,
              subtotal: orderResult.subtotal,
              discount: orderResult.discount,
              discountPercent,
              shipping: orderResult.shipping,
              tax: orderResult.tax,
              total: orderResult.total,
              paymentMethod: 'Razorpay',
              deliveryCity: city,
              deliveryState: state,
              fullName,
              email,
              phoneNumber: phone,
              addressLine1,
              addressLine2,
              pincode,
              placedAt: new Date(),
              razorpayPaymentId: response.razorpay_payment_id,
              appliedCouponCode: appliedCouponCode || undefined,
              paymentStatus: 'Confirmed',
              status: 'Being Packed',
              gstPercentSnapshot: taxDeliverySettings.globalGstPercent,
              gstAmountSnapshot: orderResult.tax,
              deliveryAmountSnapshot: orderResult.shipping,
              freeDeliveryEligibleSnapshot: (orderResult.subtotal - orderResult.discount) >= taxDeliverySettings.freeDeliveryThreshold
            });

            if (setStep) {
              setStep('confirmation');
            }
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            onOrderComplete();
          } catch (err: any) {
            console.error('[Razorpay Verify Error] verification failed:', err);
            alert('Verification Error: ' + err.message + '. Please check your Order History before paying again.');
          } finally {
            setIsPlacingOrder(false);
          }
        },
        prefill: {
          name: fullName,
          email: email || '',
          contact: phone
        },
        theme: {
          color: '#84cc16' // Mantra Brand color
        },
        modal: {
          ondismiss: async function () {
            console.log('[Razorpay Dialog] Dismissed by Devotee. Cancelling internal order:', checkoutAttemptId);
            setIsPlacingOrder(false);
            if (onPaymentCancel) {
              onPaymentCancel();
            }
            try {
              await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: checkoutAttemptId, sessionToken })
              });
            } catch (cancelErr) {
              console.warn('Failed to auto-cancel pending checkout order:', cancelErr);
            }
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('[Razorpay Pay Dialog Error]:', err);
      alert(err.message);
      setIsPlacingOrder(false);
    }
  };

  return {
    handleRazorpayPayment
  };
}
