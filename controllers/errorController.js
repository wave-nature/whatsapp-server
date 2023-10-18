const globalErrorHandler = (err, req, res, next) => {
  console.log(err, "error 🔥🔥🔥");
  err.statusCode = err.statusCode || 500;
  err.status = !!err.status;

  res.status(err.statusCode).json({
    status: err.status,
    msg: err.msg,
    error: err,
    stack: err.stack,
  });
};

export default globalErrorHandler;
