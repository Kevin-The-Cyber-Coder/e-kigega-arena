const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { requireLogin } = require('../middleware/auth');

// Dashboard data changes by role.
router.get('/dashboard', requireLogin, async (req, res) => {
  const recentChanges = await Activity.find(
    req.user.role === 'staff' ? { user: req.user._id } : {}
  )
    .sort({ createdAt: -1 })
    .limit(8);

  if (req.user.role === 'staff') {
    const actions = await Activity.find({
      user: req.user._id,
      type: { $in: ['stock_in', 'stock_out'] }
    }).select('type amount');

    const stockAdded = actions
      .filter((item) => item.type === 'stock_in')
      .reduce((sum, item) => sum + item.amount, 0);

    const stockRemoved = actions
      .filter((item) => item.type === 'stock_out')
      .reduce((sum, item) => sum + item.amount, 0);

    return res.json({
      role: 'staff',
      shift: req.user.shift || null,
      stockAdded,
      stockRemoved,
      recentChanges
    });
  }

  const products = await Product.find();
  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.minStock
  );
  const totalStockValue = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  const data = {
    role: req.user.role,
    productCount: products.length,
    totalStockValue,
    lowStockProducts,
    recentChanges
  };

  if (['super_admin', 'admin'].includes(req.user.role)) {
    data.userCount = await User.countDocuments();
    data.dayStaffCount = await User.countDocuments({ role: 'staff', shift: 'day' });
    data.nightStaffCount = await User.countDocuments({ role: 'staff', shift: 'night' });
    data.adminCount = await User.countDocuments({ role: 'admin' });
  }

  res.json(data);
});

module.exports = router;
