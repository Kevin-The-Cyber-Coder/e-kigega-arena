const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const publicUser = require('../utils/publicUser');
const { requireRole } = require('../middleware/auth');

function notFound(res) {
  return res.status(404).json({ error: 'User not found.' });
}

// GET all users (admin only).
router.get('/users', requireRole('admin'), async (req, res) => {
  const users = await User.find().select('-password -__v').sort({ createdAt: 1 });
  res.json({ users });
});

// GET one user (admin only).
router.get('/users/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id).select('-password -__v');
  if (!user) return notFound(res);

  res.json({ user });
});

// POST a user (admin only).
router.post('/users', requireRole('admin'), async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const user = await User.create({ name, email, password, role });

  await Activity.record(req.user, 'user_added', `Added ${user.name} as ${user.role}`);

  res.status(201).json({ message: 'User created.', user: publicUser(user) });
});

// PUT (update) a user (admin only).
router.put('/users/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res);

  const { name, email, role, password } = req.body || {};

  if (role && user.role === 'admin' && role !== 'admin') {
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins <= 1) {
      return res.status(400).json({ error: 'You cannot demote the last admin.' });
    }
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (password) user.password = password;

  await user.save();
  await Activity.record(req.user, 'user_edited', `Updated ${user.name}`);

  res.json({ message: 'User updated.', user: publicUser(user) });
});

// DELETE a user (admin only). You cannot remove yourself or the last admin.
router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res);

  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ error: 'You cannot remove your own account.' });
  }

  if (user.role === 'admin') {
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins <= 1) {
      return res.status(400).json({ error: 'You cannot remove the last admin.' });
    }
  }

  await user.deleteOne();
  await Activity.record(req.user, 'user_deleted', `Removed ${user.name}`);

  res.json({ message: 'User deleted.' });
});

module.exports = router;
