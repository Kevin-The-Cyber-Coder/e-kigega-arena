const User = require('../models/User');

// Add req.user when a valid login session exists.
async function attachUser(req, res, next) {
  if (!req.session.userId) return next();

  const user = await User.findById(req.session.userId).lean();

  if (user) {
    req.user = user;
  } else {
    delete req.session.userId;
  }

  next();
}

function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  next();
}

// The super admin can do everything a lower role can do.
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Please log in first.' });
    }

    if (req.user.role === 'super_admin' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Your role cannot do this.' });
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only the super admin can do this.' });
  }

  next();
}

module.exports = { attachUser, requireLogin, requireRole, requireSuperAdmin };
