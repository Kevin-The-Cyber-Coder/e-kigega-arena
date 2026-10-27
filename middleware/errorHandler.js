// Convert every thrown error into a clear JSON response.
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The JSON body is not valid.' });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ error: 'Validation failed.', errors });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    return res.status(400).json({ error: `That ${field} is already in use.` });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id or value.' });
  }

  console.error(error);
  res.status(500).json({ error: 'Something went wrong.' });
}

module.exports = errorHandler;
