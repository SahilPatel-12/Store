import ordersHandler from './_lib/customer/orders.js';
import addressesHandler from './_lib/customer/addresses.js';

export default async function handler(req, res) {
  const action = req.query.action;
  
  switch (action) {
    case 'orders':
      return ordersHandler(req, res);
    case 'addresses':
      return addressesHandler(req, res);
    default:
      return res.status(404).json({ error: `Customer action "${action || ''}" not resolved.` });
  }
}
