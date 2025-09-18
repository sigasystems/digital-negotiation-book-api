import jwt from "jsonwebtoken";

export const refreshTokenGenerator = (res, payload) => {
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, 
    secure: false, 
    sameSite: "strict", 
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return refreshToken;
};

export const accessTokenGenerator = (payload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30min",
  });
  return accessToken
}
