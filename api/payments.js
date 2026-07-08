import createOrder from './_lib/payments/create-order.js';
import verifyPayment from './_lib/payments/verify.js';

export default async function handler(req, res) {
  const action = req.query.action;
  
  switch (action) {
    case 'create-order':
      return createOrder(req, res);
    case 'verify':
      return verifyPayment(req, res);
    default:
      return res.status(404).json({ error: `Payment action "${action || ''}" not resolved.` });
  }
}
