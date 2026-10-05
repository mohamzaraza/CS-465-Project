// Routes report failures with next(err) or by throwing, and this module turns
// them into one JSON error shape. Clients get consistent errors, and internals
// such as stack traces stay in the server log.

// Express 5 already forwards rejected promises to the error middleware; the
// wrapper keeps that guarantee explicit at every route and would keep working
// on Express 4.
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// `_next` is unused but must stay: Express only treats a middleware with four
// parameters as an error handler.
export function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err?.status) && err.status >= 400 ? err.status : 500;

  // The full error (with stack) stays in the server log; clients only ever
  // receive a message.
  console.error(err);

  let message = err?.message || "Something went wrong.";
  if (err?.type === "entity.parse.failed") {
    // body-parser's message quotes the parser internals, not the problem.
    message = "Request body is not valid JSON.";
  } else if (status >= 500 && process.env.NODE_ENV === "production") {
    // Server-side messages can reveal internals (queries, file paths).
    message = "Something went wrong. Please try again later.";
  }

  res.status(status).json({ error: message });
}
