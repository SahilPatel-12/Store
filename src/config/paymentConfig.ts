/**
 * Centralized Payment Provider Configuration
 */
export const PAYMENT_CONFIG = {
  // Can be 'razorpay' or 'manual_upi'
  activePaymentProvider: 'manual_upi' as 'razorpay' | 'manual_upi',
  
  // Set to true to allow customers to check out using legacy manual UPI QR codes
  legacyManualUpiEnabled: true
};
