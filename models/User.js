const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['super_admin', 'admin', 'manager', 'staff'];
const SHIFTS = ['day', 'night'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [60, 'Name must be 60 characters or fewer.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email.']
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters.']
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be super_admin, admin, manager or staff.'
      },
      default: 'staff'
    },
    // Only staff members belong to a day or night shift.
    shift: {
      type: String,
      enum: {
        values: SHIFTS,
        message: 'Shift must be day or night.'
      },
      default: null
    },
    // Who created this account.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdByName: {
      type: String,
      default: 'System'
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model('User', userSchema);

User.ROLES = ROLES;
User.SHIFTS = SHIFTS;

module.exports = User;
