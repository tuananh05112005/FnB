// ==============================================================
// TÊN FILE: jwt.js (Config)
// MÔ TẢ: Định nghĩa và xuất các cấu hình bảo mật mã thông báo JWT (JSON Web Token).
//        - jwtSecret: Khóa bí mật dùng để ký và xác thực token.
//        - jwtExpiresIn: Thời hạn hiệu lực của token (mặc định là 86400 giây / 1 ngày).
// ==============================================================

module.exports = {
  jwtSecret: process.env.JWT_SECRET || "your_secret_key",
  jwtExpiresIn: process.env.JWT_EXPIRES || "86400", // Số giây hiệu lực của mã thông báo
};
