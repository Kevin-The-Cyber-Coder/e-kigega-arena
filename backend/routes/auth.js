const express = require('express');
const router = express.Router();
const User = require('../models/User');
const publicUser = require('../utils/publicUser');

// Who am I?
router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// Log in. Postman will store the session cookie automatically.
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (!user || !(await user.checkPassword(String(password)))) {
    return res.status(400).json({ error: 'Email or password is wrong.' });
  }

  req.session.userId = user._id.toString();
  res.json({ message: 'Logged in.', user: publicUser(user) });
});

// Log out and remove the session cookie.
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('ims.sid');
    res.json({ message: 'Logged out.' });
  });
});

module.exports = router;
