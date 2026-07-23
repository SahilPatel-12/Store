import addressesHandler from '../_lib/customer/addresses.js';

export default async function handler(req, res) {
  return addressesHandler(req, res);
}
