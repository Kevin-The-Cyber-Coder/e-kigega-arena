const Activity = require('../models/Activity');

// Save one line for the "Recent changes" lists.
// A logging problem should not stop the real inventory action from working.
async function logActivity(user, type, message, options = {}) {
  try {
    await Activity.create({
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
}

module.exports = logActivity;
