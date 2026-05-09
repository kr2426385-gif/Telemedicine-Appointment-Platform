const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  console.error(err);
  res.status(statusCode).json({ message, error: message });
};

module.exports = errorHandler;
