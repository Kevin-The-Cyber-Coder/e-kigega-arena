const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const publicUser = require('../utils/publicUser');
const { requireRole } = require('../middleware/auth');

const { ROLES, SHIFTS } = User;
const CREATABLE_BY_SUPER = ['admin', 'manager', 'staff'];
const CREATABLE_BY_ADMIN = ['manager', 'staff'];

function notFound(res) {
  return res.status(404).json({ error: 'User not found.' });
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A super admin can manage everybody. An admin can manage managers and staff.
// Nobody can manage the super admin account through the API.
function canManage(actor, target) {
  if (String(actor._id) === String(target._id)) return true;
  if (target.role === 'super_admin') return false;
  if (actor.role === 'super_admin') return true;
  if (actor.role === 'admin') return ['manager', 'staff'].includes(target.role);
  return false;
}

function creatableRoles(actor) {
  return actor.role === 'super_admin' ? CREATABLE_BY_SUPER : CREATABLE_BY_ADMIN;
}

// Staff must have a shift. Other roles must not have one.
function validateShift(role, shift) {
  if (role === 'staff') {
    if (!SHIFTS.includes(shift)) {
      return 'Staff members need a shift of day or night.';
    }
    return null;
  }

  if (shift !== undefined && shift !== null && shift !== '') {
    return 'Only staff members can have a day or night shift.';
  }

  return null;
}

// GET all users (super admin and admin). Optional filters:
// ?role=staff&shift=night&search=sam
router.get('/users', requireRole('admin'), async (req, res) => {
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.shift) filter.shift = req.query.shift;
  if (req.query.search) {
    const search = new RegExp(escapeRegExp(req.query.search), 'i');
    filter.$or = [{ name: search }, { email: search }];
  }

  const users = await User.find(filter).select('-password -__v').sort({ createdAt: 1 });

  const byRole = {};
  const byShift = {};
  for (const role of ROLES) byRole[role] = 0;
  for (const shift of SHIFTS) byShift[shift] = 0;

  for (const user of users) {
    byRole[user.role] = (byRole[user.role] || 0) + 1;
    if (user.shift) byShift[user.shift] = (byShift[user.shift] || 0) + 1;
  }

  res.json({ count: users.length, byRole, byShift, users });
});

// GET the roles and shifts that can be assigned.
router.get('/users/roles', requireRole('admin'), (req, res) => {
  res.json({
    roles: req.user.role === 'super_admin' ? CREATABLE_BY_SUPER : CREATABLE_BY_ADMIN,
    shifts: SHIFTS
  });
});

// GET one user (super admin and admin).
router.get('/users/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id).select('-password -__v');
  if (!user) return notFound(res);

  res.json({ user });
});

// Internal helper used by the three create endpoints below.
async function createUser(req, res, forcedRole) {
  const body = req.body || {};
  const { name, email, password } = body;
  const role = forcedRole || body.role;
  const shift = body.shift;
  const allowed = creatableRoles(req.user);

  if (!role) {
    return badRequest(res, `A role is required. Your role can create: ${allowed.join(', ')}.`);
  }

  if (role === 'super_admin') {
    return res.status(403).json({
      error: 'The super admin account can only be created from .env.'
    });
  }

  if (!allowed.includes(role)) {
    return res.status(403).json({
      error: `Your role can only create: ${allowed.join(', ')}.`
    });
  }

  const shiftError = validateShift(role, shift);
  if (shiftError) return badRequest(res, shiftError);

  const user = await User.create({
    name,
    email,
    password,
    role,
    shift: role === 'staff' ? shift : null,
    createdBy: req.user._id,
    createdByName: req.user.name
  });

  const shiftText = user.shift ? ` (${user.shift} shift)` : '';

  await Activity.record(
    req.user,
    'user_added',
    `Added ${user.name} as ${user.role}${shiftText}`
  );

  res.status(201).json({
    message: `${user.role} account created${shiftText}.`,
    createdBy: req.user.name,
    user: publicUser(user)
  });
}

// POST a super admin (only the super admin can create sub admins).
router.post('/users/admins', requireRole('super_admin'), (req, res) =>
  createUser(req, res, 'admin')
);

// POST a staff member (admin or super admin). A shift is required.
router.post('/users/staff', requireRole('admin'), (req, res) =>
  createUser(req, res, 'staff')
);

// POST any user allowed for your role (super admin or admin).
router.post('/users', requireRole('admin'), (req, res) => createUser(req, res));

// PUT (update) a user (super admin and admin).
router.put('/users/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res);

  if (!canManage(req.user, user)) {
    return res.status(403).json({ error: 'You cannot change this account.' });
  }

  const { name, email, role, password, shift } = req.body || {};
  const nextRole = role !== undefined ? role : user.role;
  const nextShift =
    nextRole === 'staff' ? (shift !== undefined ? shift : user.shift) : null;

  if (nextRole !== user.role) {
    if (user.role === 'super_admin') {
      return badRequest(res, 'The super admin role cannot be changed.');
    }

    if (!creatableRoles(req.user).includes(nextRole)) {
      return res.status(403).json({
        error: `Your role can only assign: ${creatableRoles(req.user).join(', ')}.`
      });
    }
  }

  const shiftError = validateShift(nextRole, nextShift);
  if (shiftError) return badRequest(res, shiftError);

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = nextRole;
  if (nextRole === 'staff') user.shift = nextShift;
  else user.shift = null;
  if (password) user.password = password;

  await user.save();
  await Activity.record(req.user, 'user_edited', `Updated ${user.name}`);

  res.json({ message: 'User updated.', user: publicUser(user) });
});

// PUT assign only a role (super admin can assign admin/manager/staff,
// an admin can assign manager/staff).
router.put('/users/:id/role', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res);

  if (!canManage(req.user, user)) {
    return res.status(403).json({ error: 'You cannot change this account.' });
  }

  if (user.role === 'super_admin') {
    return badRequest(res, 'The super admin role cannot be changed.');
  }

  const { role, shift } = req.body || {};

  if (!creatableRoles(req.user).includes(role)) {
    return res.status(403).json({
      error: `Your role can only assign: ${creatableRoles(req.user).join(', ')}.`
    });
  }

  const nextShift = role === 'staff' ? shift || user.shift : null;
  const shiftError = validateShift(role, nextShift);
  if (shiftError) return badRequest(res, shiftError);

  user.role = role;
  user.shift = nextShift;
  await user.save();

  const shiftText = user.shift ? ` (${user.shift} shift)` : '';
  await Activity.record(
    req.user,
    'role_assigned',
    `Assigned ${user.name} the ${user.role} role${shiftText}`
  );

  res.json({ message: `Role set to ${user.role}${shiftText}.`, user: publicUser(user) });
});

// PUT assign only a shift to a staff member.
router.put('/users/:id/shift', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res);

  if (!canManage(req.user, user)) {
    return res.status(403).json({ error: 'You cannot change this account.' });
  }

  if (user.role !== 'staff') {
    return badRequest(res, 'Only staff members can be assigned a shift.');
  }

  const { shift } = req.body || {};
  const shiftError = validateShift('staff', shift);
  if (shiftError) return badRequest(res, shiftError);

  user.shift = shift;
  await user.save();

  await Activity.record(
    req.user,
    'shift_assigned',
    `Assigned ${user.name} the ${shift} shift`
  );

  res.json({ message: `Shift set to ${shift}.`, user: publicUser(user) });
});

// DELETE a user (super admin and admin). You cannot remove yourself,
// the super admin, or an account above your level.
router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res);

  if (user._id.equals(req.user._id)) {
    return badRequest(res, 'You cannot remove your own account.');
  }

  if (!canManage(req.user, user)) {
    return res.status(403).json({ error: 'You cannot remove this account.' });
  }

  if (user.role === 'super_admin') {
    return badRequest(res, 'The super admin account cannot be deleted.');
  }

  if (user.role === 'admin') {
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins <= 1 && req.user.role !== 'super_admin') {
      return badRequest(res, 'You cannot remove the last sub admin.');
    }
  }

  await user.deleteOne();
  await Activity.record(req.user, 'user_deleted', `Removed ${user.name}`);

  res.json({ message: 'User deleted.' });
});

module.exports = router;
