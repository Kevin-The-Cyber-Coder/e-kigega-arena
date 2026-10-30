const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      unique: true,
      trim: true,
      maxlength: [80, 'Product name must be 80 characters or fewer.']
    },
    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [0, 'Price cannot be negative.']
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative.'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number.'
      }
    },
    minStock: {
      type: Number,
      required: true,
      min: [0, 'Minimum stock cannot be negative.'],
      default: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Minimum stock must be a whole number.'
      }
    },
    // The user who added this product.
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    addedByName: {
      type: String,
      default: 'Unknown'
    },
    addedByRole: {
      type: String,
      default: ''
    },
    // The user who last edited this product.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedByName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
