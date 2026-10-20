const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const Activity = require('../models/Activity');
const { requireLogin, requireRole } = require('../middleware/auth');

function readForm(body) {
  return {
    name: String(body.name || '').trim(),
    price: String(body.price ?? '').trim(),
    quantity: String(body.quantity ?? '').trim(),
    minStock: String(body.minStock ?? '').trim()
  };
}

function validateProduct(values) {
  const errors = [];

  if (!values.name) {
    errors.push('Product name is required.');
  } else if (values.name.length > 80) {
    errors.push('Product name must be 80 characters or fewer.');
  }

  const price = Number(values.price);
  if (values.price === '' || !Number.isFinite(price) || price < 0) {
    errors.push('Price must be a number of 0 or more.');
  }

  const quantity = Number(values.quantity);
  if (values.quantity === '' || !Number.isInteger(quantity) || quantity < 0) {
    errors.push('Quantity must be a whole number of 0 or more.');
  }

  const minStock = Number(values.minStock);
  if (values.minStock === '' || !Number.isInteger(minStock) || minStock < 0) {
    errors.push('Minimum stock must be a whole number of 0 or more.');
  }

  return {
    errors,
    data: {
      name: values.name,
      price: Math.round(price * 100) / 100,
      quantity,
      minStock
    }
  };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function nameIsTaken(name, ignoreId = null) {
  const query = { name: new RegExp(`^${escapeRegExp(name)}$`, 'i') };
  if (ignoreId) query._id = { $ne: ignoreId };
  return Product.exists(query);
}

// Everyone can see the products.
router.get('/products', requireLogin, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 }).lean();
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// Managers and admins can add products.
router.post('/products', requireRole('admin', 'manager'), async (req, res, next) => {
  const values = readForm(req.body);
  const { errors, data } = validateProduct(values);

  try {
    if (errors.length === 0 && (await nameIsTaken(data.name))) {
      errors.push('A product with that name already exists.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Please check the product details.',
        errors
      });
    }

    const product = await Product.create(data);

    await Activity.record(req.user, 'product_added', `Added product ${product.name}`, {
      productName: product.name
    });

    res.status(201).json({
      message: `${product.name} was added.`,
      product
    });
  } catch (error) {
    next(error);
  }
});

// Managers and admins can edit products.
router.put('/products/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'That product was not found.' });
  }

  const values = readForm(req.body);
  const { errors, data } = validateProduct(values);

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'That product was not found.' });
    }

    if (errors.length === 0 && (await nameIsTaken(data.name, product._id))) {
      errors.push('A product with that name already exists.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Please check the product details.',
        errors
      });
    }

    product.name = data.name;
    product.price = data.price;
    product.quantity = data.quantity;
    product.minStock = data.minStock;
    await product.save();

    await Activity.record(req.user, 'product_edited', `Edited product ${product.name}`, {
      productName: product.name
    });

    res.json({
      message: `${product.name} was updated.`,
      product
    });
  } catch (error) {
    next(error);
  }
});

// Only an admin can delete a product.
router.delete('/products/:id', requireRole('admin'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'That product was not found.' });
  }

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'That product was not found.' });
    }

    await product.deleteOne();

    await Activity.record(req.user, 'product_deleted', `Deleted product ${product.name}`, {
      productName: product.name
    });

    res.json({ message: `${product.name} was deleted.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
