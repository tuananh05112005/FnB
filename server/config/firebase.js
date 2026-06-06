// ==============================================================
// TÊN FILE: firebase.js (Config)
// MÔ TẢ: Khởi tạo và kết nối SDK quản trị Firebase Admin (Firebase Admin SDK).
//        - Sử dụng file cấu hình dịch vụ tài khoản firebase-service-account.json.
//        - Phục vụ xác thực ID Token khi đăng nhập bằng tài khoản Google.
// ==============================================================

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Khởi tạo Firebase Admin App nếu chưa được khởi tạo trước đó
if(!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
module.exports = admin;