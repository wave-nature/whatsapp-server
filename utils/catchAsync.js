const catchAsync = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
  // return fn(req, res, next).catch(next);
};

export default catchAsync;
