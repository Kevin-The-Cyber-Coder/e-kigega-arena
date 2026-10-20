const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { requireLogin } = require('../middleware/auth');

// The dashboard data changes depending on the user's role.
router.get('/dashboard', requireLogin, async (req, res, next) => {
  try {
    const recentChanges = await Activity.find(
      req.user.role === 'staff' ? { user: req.user._id } : {}
    )
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    if (req.user.role === 'staff') {
      const actions = await Activity.find({
        user: req.user._id,
        type: { $in: ['stock_in', 'stock_out'] }
      })
        .select('type amount')
        .lean();

      let stockAdded = 0;
      let stockRemoved = 0;

      actions.forEach((action) => {
        if (action.type === 'stock_in') stockAdded += action.amount;
        if (action.type === 'stock_out') stockRemoved += action.amount;
      });

      return res.json({
        role: req.user.role,
        stockAdded,
        stockRemoved,
        recentChanges
      });
    }

    const products = await Product.find().lean();
    const lowStockProducts = products
      .filter((product) => product.quantity <= product.minStock)
      .sort((a, b) => a.quantity - b.quantity);

    const totalStockValue = products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    let userCount = null;
    if (req.user.role === 'admin') {
      userCount = await User.countDocuments();
    }

    res.json({
      role: req.user.role,
      userCount,
      productCount: products.length,
      totalStockValue,
      lowStockProducts,
      recentChanges
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
