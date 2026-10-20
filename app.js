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

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: false, limit: '10kb' }));
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
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);

// Values that every EJS page can use.
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  res.locals.currentPath = req.path;
  res.locals.roleLabel = (role) =>
    role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
  res.locals.formatMoney = (value) =>
    moneyFormatter.format(Number(value) || 0);
  res.locals.formatDate = (value) => dateFormatter.format(new Date(value));

  next();
});

app.use(attachUser);

app.get('/', (req, res) => {
  res.redirect(req.user ? '/dashboard' : '/login');
});

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(productRoutes);
app.use(stockRoutes);
app.use(userRoutes);

// Page not found.
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    status: 404,
    message: 'The page you asked for does not exist.'
  });
});

// Any unexpected error ends up here.
app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).render('error', {
    title: 'Something went wrong',
    status: 500,
    message: 'Something went wrong. Please go back and try again.'
  });
});

// The very first time the app runs, create one admin from .env.
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
