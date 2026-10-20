require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const connectDB = require('./config/db');
const User = require('./models/User');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const userRoutes = require('./routes/users');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    name: 'ims.sid',
    secret: process.env.SESSION_SECRET || 'local-development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// Attach the logged-in user before the API routes run.
app.use(attachUser);

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', productRoutes);
app.use('/api', stockRoutes);
app.use('/api', userRoutes);

// Unknown API route.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Everything else is the single HTML page.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Return JSON errors for the API.
app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'Something went wrong.' });
  }

  res.status(500).send('Something went wrong.');
});

// The first time the app runs, create one admin from .env.
async function ensureFirstAdmin() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await User.create({ name, email, password, role: 'admin' });

  console.log('No users found. Created the first admin account:');
  console.log(`  Email: ${email}`);
  console.log('  Password: the ADMIN_PASSWORD value in your .env file');
}

async function start() {
  await connectDB();
  await ensureFirstAdmin();

  app.listen(PORT, () => {
    console.log(`Simple Inventory is running at http://localhost:${PORT}`);
  });
}

start();
