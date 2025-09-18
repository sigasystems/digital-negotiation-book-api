import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  let token;

  // 1. Check Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  // 2. If not in header, check cookies
  if (!token && req.cookies?.refreshToken) {
    token = req.cookies.refreshToken;
  }

  // 3. (Optional) Check query params (e.g., for WebSocket or special cases)
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  // 4. If no token found, reject
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  // 5. Verify token
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decoded; // attach decoded JWT payload
    next();
  });
};
