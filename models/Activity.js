const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    // The user who did the action. Kept as a name too, so old activity
    // still reads correctly if the user is later deleted.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actorName: {
      type: String,
      required: true
    },
    actorRole: {
      type: String,
      enum: ['admin', 'manager', 'staff'],
      required: true
    },
    type: {
      type: String,
      enum: [
        'stock_in',
        'stock_out',
        'product_added',
        'product_edited',
        'product_deleted',
        'user_added',
        'user_deleted'
      ],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      default: 0
    },
    productName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Save one activity line. A logging problem should not stop the
// inventory action itself from working.
activitySchema.statics.record = async function (user, type, message, options = {}) {
  try {
    await this.create({
      user: user._id,
      actorName: user.name,
      actorRole: user.role,
      type,
      message,
      amount: options.amount || 0,
      productName: options.productName || ''
    });
  } catch (error) {
    console.error('Could not save activity:', error.message);
  }
};

module.exports = mongoose.model('Activity', activitySchema);
