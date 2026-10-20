const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number.'
      }
    },
    minStock: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Minimum stock must be a whole number.'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
