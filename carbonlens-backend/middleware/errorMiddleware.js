const errorHandler = (err, _req, res, _next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

const notFound = (req, res, next) => {
  const e = new Error(`Not found — ${req.originalUrl}`);
  res.status(404);
  next(e);
};

module.exports = { errorHandler, notFound };
