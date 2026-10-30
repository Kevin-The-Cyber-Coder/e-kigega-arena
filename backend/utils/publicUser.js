// The safe user shape returned by the API (never includes the password).
function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shift: user.shift || null,
    createdByName: user.createdByName || 'System',
    createdAt: user.createdAt
  };
}

module.exports = publicUser;
