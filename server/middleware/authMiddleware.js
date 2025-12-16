import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  console.log("AUTH HEADER:", req.headers.authorization);
  console.log("JWT SECRET LOADED:", process.env.JWT_SECRET?.length);

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT VERIFY ERROR:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  });
}
