const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { requireLogin } = require('../middleware/auth');

async function changeStock(req, res, next, direction) {
  const productId = String(req.body.productId || '');
  const amount = Number(req.body.amount);

  try {
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: 'Please choose a product.' });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a whole number greater than 0.'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'That product was not found.' });
    }

    if (direction === 'out' && product.quantity < amount) {
      return res.status(400).json({
        error: `Not enough stock. ${product.name} has ${product.quantity} left.`
      });
    }

    product.quantity += direction === 'in' ? amount : -amount;
    await product.save();

    const action = direction === 'in' ? 'Added' : 'Removed';
    const preposition = direction === 'in' ? 'to' : 'from';

    await Activity.record(
      req.user,
      direction === 'in' ? 'stock_in' : 'stock_out',
      `${action} ${amount} ${amount === 1 ? 'unit' : 'units'} ${preposition} ${product.name}`,
      { amount, productName: product.name }
    );

    res.json({
      message: `${action} ${amount} ${amount === 1 ? 'unit' : 'units'} ${preposition} ${product.name}. New stock: ${product.quantity}.`,
      product
    });
  } catch (error) {
    next(error);
  }
}

// Products and recent stock movements for the stock page.
router.get('/stock', requireLogin, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 }).lean();
    const movements = await Activity.find({
      type: { $in: ['stock_in', 'stock_out'] }
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    res.json({ products, movements });
  } catch (error) {
    next(error);
  }
});

// All logged-in roles can add stock.
router.post('/stock/in', requireLogin, (req, res, next) => {
  changeStock(req, res, next, 'in');
});

// All logged-in roles can remove stock, but never below 0.
router.post('/stock/out', requireLogin, (req, res, next) => {
  changeStock(req, res, next, 'out');
});

module.exports = router;
