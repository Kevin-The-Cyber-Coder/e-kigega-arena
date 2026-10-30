require('dotenv').config();

const express = require('express');
const session = require('express-session');
const connectDB = require('./config/db');
const User = require('./models/User');
const { attachUser } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(
  session({
    name: 'ims.sid',
    secret: process.env.SESSION_SECRET || 'local-development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
  })
);

app.use(attachUser);
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/dashboard'));
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/stock'));
app.use('/api', require('./routes/users'));

// A small index of the API, useful when testing in Postman.
app.get(['/', '/api'], (req, res) => {
  res.json({
    name: 'E-Kigega Arena Inventory API',
    status: 'running',
    roles: ['super_admin', 'admin', 'manager', 'staff'],
    shifts: ['day', 'night'],
    login: 'POST /api/login',
    endpoints: [
      'GET /api/me',
      'POST /api/login',
      'POST /api/logout',
      'GET /api/dashboard',
      'GET /api/products',
      'GET /api/products/:id',
      'POST /api/products',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'GET /api/stock',
      'POST /api/stock/in',
      'POST /api/stock/out',
      'GET /api/users',
      'GET /api/users/roles',
      'GET /api/users/:id',
      'POST /api/users',
      'POST /api/users/admins',
      'POST /api/users/staff',
      'PUT /api/users/:id',
      'PUT /api/users/:id/role',
      'PUT /api/users/:id/shift',
      'DELETE /api/users/:id'
    ]
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

// Create the default super admin when the database has none.
async function createDefaultSuperAdmin() {
  if (await User.exists({ role: 'super_admin' })) return;

  const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com').toLowerCase();

  // If the configured email already belongs to an account, promote it.
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'super_admin';
    existing.shift = null;
    await existing.save();
    console.log(`Existing account ${email} promoted to super admin.`);
    return;
  }

  await User.create({
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
    email,
    password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
    role: 'super_admin',
    createdByName: 'System'
  });

  console.log(`Default super admin created: ${email}`);
}

async function start() {
  await connectDB();
  await createDefaultSuperAdmin();
  app.listen(PORT, () => console.log(`API: http://localhost:${PORT}/api`));
}

start();
