const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simple_inventory';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri);
  } catch (error) {
    console.error('Could not connect to MongoDB.');
    console.error(error.message);
    console.error('Is MongoDB running? Check the README for help.');
    process.exit(1);
  }
}

module.exports = connectDB;
