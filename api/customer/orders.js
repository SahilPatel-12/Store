import ordersHandler from '../_lib/customer/orders.js';

export default async function handler(req, res) {
  return ordersHandler(req, res);
}
