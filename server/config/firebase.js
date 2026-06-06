// ==============================================================
// TÊN FILE: firebase.js (Config)
// MÔ TẢ: Khởi tạo và kết nối SDK quản trị Firebase Admin (Firebase Admin SDK).
//        - Sử dụng file cấu hình dịch vụ tài khoản firebase-service-account.json.
//        - Phục vụ xác thực ID Token khi đăng nhập bằng tài khoản Google.
// ==============================================================

const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("Lỗi parse FIREBASE_SERVICE_ACCOUNT:", e);
    }
} else {
    try {
        serviceAccount = require('../firebase-service-account.json');
    } catch (e) {
        console.warn("Không tìm thấy file firebase-service-account.json và chưa cấu hình FIREBASE_SERVICE_ACCOUNT.");
    }
}

// Khởi tạo Firebase Admin App nếu chưa được khởi tạo trước đó và có thông tin credential
if(!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully.");
    } else {
        console.warn("Firebase Admin không thể khởi tạo vì thiếu thông tin xác thực.");
    }
}
module.exports = admin;