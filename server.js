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
    name: 'Simple Inventory API',
    status: 'running',
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
      'GET /api/users/:id',
      'POST /api/users',
      'PUT /api/users/:id',
      'DELETE /api/users/:id'
    ]
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

async function createFirstAdmin() {
  if (await User.countDocuments()) return;

  await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin'
  });

  console.log('First admin created from .env');
}

async function start() {
  await connectDB();
  await createFirstAdmin();
  app.listen(PORT, () => console.log(`API: http://localhost:${PORT}/api`));
}

start();
