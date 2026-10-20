const User = require('../models/User');

// Put the logged-in user on req.user. API routes use this instead of views.
async function attachUser(req, res, next) {
  if (!req.session.userId) {
    return next();
  }

  try {
    const user = await User.findById(req.session.userId).lean();

    if (!user) {
      delete req.session.userId;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }

  next();
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Please log in to continue.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Your role does not allow that.' });
    }

    next();
  };
}

module.exports = { attachUser, requireLogin, requireRole };
