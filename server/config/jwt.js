// config/jwt.js
module.exports = {
  jwtSecret: process.env.JWT_SECRET || "your_secret_key",
  jwtExpiresIn: process.env.JWT_EXPIRES || "86400", // seconds
};
