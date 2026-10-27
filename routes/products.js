const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { requireLogin, requireRole } = require('../middleware/auth');

function productData(body) {
  return {
    name: body.name,
    price: body.price,
    quantity: body.quantity,
    minStock: body.minStock
  };
}

function notFound(res) {
  return res.status(404).json({ error: 'Product not found.' });
}

// GET all products.
router.get('/products', requireLogin, async (req, res) => {
  const products = await Product.find().sort({ name: 1 });
  res.json({ products });
});

// GET one product by id.
router.get('/products/:id', requireLogin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findById(req.params.id);
  if (!product) return notFound(res);

  res.json({ product });
});

// POST a product (admin and manager only).
router.post('/products', requireRole('admin', 'manager'), async (req, res) => {
  const product = await Product.create(productData(req.body || {}));

  await Activity.record(req.user, 'product_added', `Added product ${product.name}`, {
    productName: product.name
  });

  res.status(201).json({ message: 'Product created.', product });
});

// PUT (update) a product (admin and manager only).
router.put('/products/:id', requireRole('admin', 'manager'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    productData(req.body || {}),
    { new: true, runValidators: true }
  );

  if (!product) return notFound(res);

  await Activity.record(req.user, 'product_edited', `Edited product ${product.name}`, {
    productName: product.name
  });

  res.json({ message: 'Product updated.', product });
});

// DELETE a product (admin only).
router.delete('/products/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return notFound(res);

  await Activity.record(req.user, 'product_deleted', `Deleted product ${product.name}`, {
    productName: product.name
  });

  res.json({ message: 'Product deleted.' });
});

module.exports = router;
