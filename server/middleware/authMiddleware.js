import jwt from "jsonwebtoken";

// Nothing here is logged: headers and tokens are credentials, and a 401 is
// routine traffic, not a server fault.
export function authenticateToken(req, res, next) {
  const [scheme, token, ...rest] = (req.headers.authorization ?? "").split(" ");

  if (scheme !== "Bearer" || !token || rest.length > 0) {
    return res.status(401).json({ error: "Missing or malformed authorization header." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid token.";
      return res.status(401).json({ error: message });
    }

    req.user = user;
    next();
  });
}
