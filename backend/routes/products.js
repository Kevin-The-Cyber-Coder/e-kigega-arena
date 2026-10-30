const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { requireLogin, requireRole } = require('../middleware/auth');

const PERSON_FIELDS = 'name email role shift';

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

function withPeople(query) {
  return query
    .populate('addedBy', PERSON_FIELDS)
    .populate('updatedBy', PERSON_FIELDS);
}

// GET all products. Each product shows who added and last edited it.
router.get('/products', requireLogin, async (req, res) => {
  const filter = {};
  if (req.query.addedBy && mongoose.isValidObjectId(req.query.addedBy)) {
    filter.addedBy = req.query.addedBy;
  }

  const products = await withPeople(Product.find(filter).sort({ name: 1 }));
  res.json({ products });
});

// GET one product by id.
router.get('/products/:id', requireLogin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await withPeople(Product.findById(req.params.id));
  if (!product) return notFound(res);

  res.json({ product });
});

// POST a product. Every logged-in user can add one, and the creator is saved.
router.post(
  '/products',
  requireRole('super_admin', 'admin', 'manager', 'staff'),
  async (req, res) => {
    const product = await Product.create({
      ...productData(req.body || {}),
      addedBy: req.user._id,
      addedByName: req.user.name,
      addedByRole: req.user.role
    });

    await Activity.record(req.user, 'product_added', `Added product ${product.name}`, {
      productName: product.name
    });

    res.status(201).json({
      message: `Product created by ${req.user.name}.`,
      addedBy: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        shift: req.user.shift || null
      },
      product
    });
  }
);

// PUT (update) a product (super_admin, admin and manager only).
router.put(
  '/products/:id',
  requireRole('super_admin', 'admin', 'manager'),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...productData(req.body || {}),
        updatedBy: req.user._id,
        updatedByName: req.user.name
      },
      { new: true, runValidators: true }
    );

    if (!product) return notFound(res);

    await Activity.record(req.user, 'product_edited', `Edited product ${product.name}`, {
      productName: product.name
    });

    res.json({ message: 'Product updated.', product });
  }
);

// DELETE a product (super_admin and admin only).
router.delete('/products/:id', requireRole('super_admin', 'admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return notFound(res);

  await Activity.record(req.user, 'product_deleted', `Deleted product ${product.name}`, {
    productName: product.name
  });

  res.json({ message: 'Product deleted.' });
});

module.exports = router;
