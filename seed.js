// Run `npm run seed` to replace the database with demo users,
// products and activity. This deletes the current inventory data.
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Activity = require('./models/Activity');

async function seed() {
  await connectDB();

  console.log('Clearing old demo data...');
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Activity.deleteMany({})
  ]);

  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  });

  const manager = await User.create({
    name: 'Mia Manager',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager'
  });

  const staff = await User.create({
    name: 'Sam Staff',
    email: 'staff@example.com',
    password: 'staff123',
    role: 'staff'
  });

  await Product.create([
    { name: 'Wireless Mouse', price: 24.99, quantity: 8, minStock: 10 },
    { name: 'USB-C Cable', price: 9.99, quantity: 42, minStock: 15 },
    { name: 'Notebook A5', price: 4.5, quantity: 3, minStock: 8 },
    { name: 'Desk Lamp', price: 34.0, quantity: 0, minStock: 5 },
    { name: 'Coffee Beans', price: 12.75, quantity: 18, minStock: 6 }
  ]);

  await Activity.create([
    {
      user: admin._id,
      actorName: admin.name,
      actorRole: admin.role,
      type: 'user_added',
      message: 'Added Mia Manager as manager'
    },
    {
      user: admin._id,
      actorName: admin.name,
      actorRole: admin.role,
      type: 'user_added',
      message: 'Added Sam Staff as staff'
    },
    {
      user: manager._id,
      actorName: manager.name,
      actorRole: manager.role,
      type: 'product_added',
      message: 'Added product Wireless Mouse',
      productName: 'Wireless Mouse'
    },
    {
      user: manager._id,
      actorName: manager.name,
      actorRole: manager.role,
      type: 'product_added',
      message: 'Added product USB-C Cable',
      productName: 'USB-C Cable'
    },
    {
      user: manager._id,
      actorName: manager.name,
      actorRole: manager.role,
      type: 'product_added',
      message: 'Added product Notebook A5',
      productName: 'Notebook A5'
    },
    {
      user: manager._id,
      actorName: manager.name,
      actorRole: manager.role,
      type: 'product_added',
      message: 'Added product Desk Lamp',
      productName: 'Desk Lamp'
    },
    {
      user: manager._id,
      actorName: manager.name,
      actorRole: manager.role,
      type: 'product_added',
      message: 'Added product Coffee Beans',
      productName: 'Coffee Beans'
    },
    {
      user: staff._id,
      actorName: staff.name,
      actorRole: staff.role,
      type: 'stock_in',
      message: 'Added 30 units to Wireless Mouse',
      amount: 30,
      productName: 'Wireless Mouse'
    },
    {
      user: staff._id,
      actorName: staff.name,
      actorRole: staff.role,
      type: 'stock_out',
      message: 'Removed 22 units from Wireless Mouse',
      amount: 22,
      productName: 'Wireless Mouse'
    },
    {
      user: staff._id,
      actorName: staff.name,
      actorRole: staff.role,
      type: 'stock_in',
      message: 'Added 50 units to USB-C Cable',
      amount: 50,
      productName: 'USB-C Cable'
    },
    {
      user: staff._id,
      actorName: staff.name,
      actorRole: staff.role,
      type: 'stock_out',
      message: 'Removed 8 units from USB-C Cable',
      amount: 8,
      productName: 'USB-C Cable'
    },
    {
      user: staff._id,
      actorName: staff.name,
      actorRole: staff.role,
      type: 'stock_out',
      message: 'Removed 5 units from Notebook A5',
      amount: 5,
      productName: 'Notebook A5'
    },
    {
      user: staff._id,
      actorName: staff.name,
      actorRole: staff.role,
      type: 'stock_in',
      message: 'Added 18 units to Coffee Beans',
      amount: 18,
      productName: 'Coffee Beans'
    }
  ]);

  console.log('');
  console.log('Demo data created successfully.');
  console.log('');
  console.log('  Admin    admin@example.com    / admin123');
  console.log('  Manager  manager@example.com  / manager123');
  console.log('  Staff    staff@example.com    / staff123');
  console.log('');
  console.log('Start the app with: npm start');

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Could not create demo data:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
