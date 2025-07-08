# 🧋 Website Đặt Đồ Uống - Báo Cáo Thực Tập

## 📌 Giới thiệu

Dự án "Website đặt đồ uống" là một hệ thống web giúp người dùng có thể đặt các loại đồ uống trực tuyến, tích hợp thanh toán VietQR, đăng nhập bằng Google, phân quyền Admin/Staff/User và hỗ trợ quản lý đơn hàng, sản phẩm.

> 🎓 Dự án được thực hiện trong khuôn khổ thực tập tốt nghiệp tại Công ty TNHH Tổng Hợp Quốc Tế Golden NQ.

---

## 🔧 Công nghệ sử dụng

* **Frontend:** ReactJS, Bootstrap 5
* **Backend:** Node.js, ExpressJS
* **Database:** MySQL
* **Authentication:** Firebase (Google Login), JWT
* **API tích hợp:** VietQR, OpenStreetMap

---

## 📂 Cấu trúc thư mục

```
FnB/
├── client/         # ReactJS frontend
├── server/         # Node.js backend
├── README.md       # File hướng dẫn (bạn đang xem)
```

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone mã nguồn

```bash
git clone https://github.com/tuananh05112005/FnB.git
cd prdrink
```

### 2. Cài đặt và chạy FRONTEND

```bash
cd client
npm install
npm start
```

➡️ Mặc định chạy tại: `http://localhost:3000`

### 3. Cài đặt và chạy BACKEND

```bash
cd ../server
npm install
npm run dev
```

➡️ Backend chạy tại: `http://localhost:5000`

---

## 🛠 Thiết lập MySQL Database

1. Tạo database: `pr`
2. Import các bảng: `users`, `products`, `cart_`, `payments_`, `product_edit_logs`, `password_resets`
3. Cấu hình kết nối DB trong `server.js`:

```js
const db = mysql.createConnection({
  host: "localhost", // Địa chỉ MySQL server
  user: "root", // Tài khoản MySQL
  password: "05112005", // Mật khẩu MySQL
  database: "pr" // Tên database
});
```

---

## 🔑 Thiết lập Firebase (Google Login)

1. Tạo project tại [firebase.google.com](https://firebase.google.com)
2. Bật **Authentication → Google Sign-in**
3. Tải file `firebase-service-account.json`
4. Đặt trong thư mục `server/`
5. Import trong `server.js`:

```js
const serviceAccount = require("./firebase-service-account.json");
/* ==================== CẤU HÌNH FIREBASE ==================== */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
```

---

## ⚙️ Các chức năng chính

* Đăng ký / Đăng nhập (Google, Email)
* Xem & tìm kiếm sản phẩm
* Thêm giỏ hàng, thanh toán VietQR
* Lịch sử mua hàng (User)
* Admin: Quản lý nhân viên, doanh thu, đơn hàng
* Staff: Quản lý sản phẩm và đơn

---

## 🔍 Kiểm thử API bằng Postman (tuỳ chọn)

* Base URL: `http://localhost:5000/api`
* Sử dụng token JWT trong headers: `Authorization: Bearer <token>`

---

## 📎 Tài liệu tham khảo

* ReactJS: [https://reactjs.org/docs](https://reactjs.org/docs)
* Node.js: [https://nodejs.org/en/docs](https://nodejs.org/en/docs)
* ExpressJS: [https://expressjs.com](https://expressjs.com)
* MySQL Docs: [https://dev.mysql.com/doc](https://dev.mysql.com/doc)
* Bootstrap: [https://getbootstrap.com](https://getbootstrap.com)
* VietQR API: [https://vietqr.net](https://vietqr.net)
* Firebase Auth: [https://firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)

---


