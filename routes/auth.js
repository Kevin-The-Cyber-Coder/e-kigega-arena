const express = require('express');
const router = express.Router();
const User = require('../models/User');

function publicUser(user) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

// Tell the page who is logged in, if anyone.
router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// Check the email and password.
router.post('/login', async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    if (!email || !password) {
      return res.status(400).json({
        error: 'Please enter your email and password.'
      });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.checkPassword(password))) {
      return res.status(400).json({
        error: 'Email or password is incorrect.'
      });
    }

    req.session.userId = user._id.toString();
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

// Log out by removing the session.
router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Could not log out.' });
    }

    res.clearCookie('ims.sid');
    res.json({ ok: true });
  });
});

module.exports = router;
