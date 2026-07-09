import whatsappConfig from './_lib/admin/whatsapp-config.js';
import msg91Config from './_lib/admin/msg91-config.js';
import razorpayConfig from './_lib/admin/razorpay-config.js';
import razorpayTest from './_lib/admin/razorpay-test.js';
import ordersUpdate from './_lib/admin/orders-update.js';
import ordersConfirm from './_lib/admin/orders-confirm.js';
import ordersDecline from './_lib/admin/orders-decline.js';
import ordersList from './_lib/admin/orders-list.js';

export default async function handler(req, res) {
  const action = req.query.action;
  
  switch (action) {
    case 'whatsapp-config':
      return whatsappConfig(req, res);
    case 'msg91-config':
      return msg91Config(req, res);
    case 'razorpay-config':
      return razorpayConfig(req, res);
    case 'razorpay-test':
      return razorpayTest(req, res);
    case 'orders-update':
      return ordersUpdate(req, res);
    case 'orders-confirm':
      return ordersConfirm(req, res);
    case 'orders-decline':
      return ordersDecline(req, res);
    case 'orders-list':
      return ordersList(req, res);
    default:
      return res.status(404).json({ error: `Admin action "${action || ''}" not resolved.` });
  }
}
