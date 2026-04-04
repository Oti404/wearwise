'use strict';

const checkoutService = require('../services/checkoutSqlService');

const checkout = async (req, res) => {
  const { items } = req.body;
  // buyerUid comes from the verified token
  const soldIds = await checkoutService.processCheckout(req.user.uid, items);
  res.json({ success: true, message: 'Comanda procesată cu succes.', soldIds });
};

const relist = async (req, res) => {
  const { itemId, updates } = req.body;
  await checkoutService.relist(req.user.uid, itemId, updates);
  res.json({ success: true, message: 'Articolul a fost re-listat cu succes!' });
};

module.exports = { checkout, relist };
