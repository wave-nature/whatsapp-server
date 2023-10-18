import AppError from "./appError.js";

export function checkBody(fields) {
  return function (req, res, next) {
    const errors = fields
      .map((field) => {
        if (!req.body[field]) {
          return `Missing field ${field}`;
        }
      })
      .filter((el) => !!el);
    if (errors && errors.length > 0) {
      next(new AppError(errors[0], 400));
      return;
    }
    return next();
  };
}
export function checkQuery(fields) {
  return function (req, res, next) {
    const errors = fields
      .map((field) => {
        if (!req.query[field]) {
          return `Missing field ${field}`;
        }
      })
      .filter((el) => !!el);
    if (errors && errors.length > 0) {
      next(new AppError(errors[0], 400));
      return;
    }
    return next();
  };
}
