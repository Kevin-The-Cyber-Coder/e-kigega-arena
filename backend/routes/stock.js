const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { requireLogin } = require('../middleware/auth');

async function changeStock(req, res, direction) {
  const { productId, amount } = req.body || {};
  const quantity = Number(amount);

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ error: 'A valid productId is required.' });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Amount must be a whole number above 0.' });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  if (direction === 'out' && product.quantity < quantity) {
    return res.status(400).json({
      error: `Not enough stock. ${product.name} has ${product.quantity} left.`
    });
  }

  product.quantity += direction === 'in' ? quantity : -quantity;
  await product.save();

  const action = direction === 'in' ? 'Added' : 'Removed';
  const word = direction === 'in' ? 'to' : 'from';

  await Activity.record(
    req.user,
    direction === 'in' ? 'stock_in' : 'stock_out',
    `${action} ${quantity} to ${product.name}`,
    { amount: quantity, productName: product.name }
  );

  res.json({
    message: `${action} ${quantity} ${word} ${product.name}. New stock: ${product.quantity}.`,
    product
  });
}

// GET stock page data: products and recent movements.
router.get('/stock', requireLogin, async (req, res) => {
  const products = await Product.find().sort({ name: 1 });
  const movements = await Activity.find({
    type: { $in: ['stock_in', 'stock_out'] }
  })
    .sort({ createdAt: -1 })
    .limit(12);

  res.json({ products, movements });
});

// POST stock in.
router.post('/stock/in', requireLogin, (req, res) => changeStock(req, res, 'in'));

// POST stock out.
router.post('/stock/out', requireLogin, (req, res) => changeStock(req, res, 'out'));

module.exports = router;
