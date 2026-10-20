const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const { requireRole } = require('../middleware/auth');

const ROLES = ['admin', 'manager', 'staff'];

function publicUser(user) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

// Only admins can list users.
router.get('/users', requireRole('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: 1 }).lean();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Create a user and choose their role.
router.post('/users', requireRole('admin'), async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = String(req.body.role || 'staff');
  const errors = [];

  if (!name) {
    errors.push('Name is required.');
  } else if (name.length > 60) {
    errors.push('Name must be 60 characters or fewer.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (!ROLES.includes(role)) {
    errors.push('Please choose a valid role.');
  }

  try {
    if (errors.length === 0 && (await User.exists({ email }))) {
      errors.push('A user with that email already exists.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Please check the user details.',
        errors
      });
    }

    const user = await User.create({ name, email, password, role });

    await Activity.record(req.user, 'user_added', `Added ${user.name} as ${user.role}`);

    res.status(201).json({
      message: `${user.name} was added as ${user.role}.`,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

// Remove a user. You cannot remove yourself or the last admin.
router.delete('/users/:id', requireRole('admin'), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'That user was not found.' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'That user was not found.' });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ error: 'You cannot remove your own account.' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'You cannot remove the last admin.' });
      }
    }

    await user.deleteOne();

    await Activity.record(req.user, 'user_deleted', `Removed ${user.name}`);

    res.json({ message: `${user.name} was removed.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
