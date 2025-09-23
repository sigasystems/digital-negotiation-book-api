import jwt from "jsonwebtoken";
import { errorResponse } from "../handlers/responseHandler.js"; // adjust path

export const authenticateJWT = (req, res, next) => {
  try {
    let token;
    let secret;

    // 1. Check Authorization header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      secret = process.env.ACCESS_TOKEN_SECRET;
    }
    // 2. If not in header, check cookies
    if (!token && req.cookies) {
      token = req.cookies.accessToken || req.cookies.refreshToken;
      secret = process.env.REFRESH_TOKEN_SECRET; // use refresh token secret for cookies
    }

    // 4. If no token found, reject
    if (!token) {
      return errorResponse(res, 401, "Unauthorized: No token provided");
    }

    // 5. Verify token with the correct secret
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return errorResponse(res, 403, "Invalid or expired token", err.message);
      }

      req.user = decoded; // attach decoded JWT payload
      next();
    });
  } catch (err) {
    return errorResponse(res, 500, "Internal Server Error", err.message);
  }
};
