
##  Giới thiệu
Website đặt đồ uống online được xây dựng nhằm hỗ trợ khách hàng dễ dàng đặt trà sữa, cà phê và các loại thức uống trực tuyến. Hệ thống đồng thời cung cấp dashboard quản trị giúp quản lý sản phẩm, đơn hàng, doanh thu và giao diện menu.

Dự án được phát triển theo mô hình Fullstack với frontend và backend tách riêng, hỗ trợ realtime và tích hợp nhiều tính năng quản lý hiện đại.

---

#  Công nghệ sử dụng

## Frontend

* ReactJS
* React Router DOM
* Axios
* Socket.IO Client
* React Icons
* Bootstrap / CSS

## Backend

* Node.js
* ExpressJS
* MySQL
* Firebase Admin SDK
* JWT Authentication
* Socket.IO

## Dịch vụ tích hợp

* Firebase Authentication
* Google Login
* VietQR
* Sepay

---

#  Cấu trúc thư mục

```bash
FnB/
│
├── client/                  # Frontend ReactJS
│
├── server/                  # Backend ExpressJS
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── services/
│   └── server.js
│
└── README.md
```

---

#  Chức năng chính

##  Người dùng

* Đăng ký / đăng nhập / quên mật khẩu (sẽ gửi về tài khoản gmail mà mình gắn vào + sử dụng nodemailer để tự động gửi reset mật khẩu)
* Đăng nhập Google
* Xem danh sách sản phẩm
* Tìm kiếm và lọc sản phẩm
* Thêm vào giỏ hàng
* Thanh toán online / offline
* Theo dõi lịch sử đơn hàng
* Đánh giá sản phẩm
* Yêu thích sản phẩm
* Nhận voucher và điểm thưởng

---

##  Staff

* Quản lý đơn hàng
* Cập nhật trạng thái đơn
* Quản lý sản phẩm
* Bật / tắt món tạm hết hàng
* Hỗ trợ xử lý đơn cho khách
* Quản lý danh mục hiển thị

---

##  Admin

* Quản lý toàn bộ hệ thống
* Quản lý người dùng
* Quản lý nhân viên
* Quản lý doanh thu
* Quản lý voucher
* Quản lý sản phẩm & danh mục
* Quản lý danh mục hiển thị
* Bật / tắt món tạm hết hàng
* Tùy chỉnh giao diện menu
* Theo dõi lịch sử chỉnh sửa sản phẩm
* Đồng bộ realtime bằng Socket.IO
* Tích hợp API Pexels để tự động tìm ảnh

---

# ⚙️ Hướng dẫn cài đặt

## 1. Clone project

```bash
git clone https://github.com/tuananh05112005/FnB.git
cd FnB
```

---

## 2. Cài đặt Frontend

```bash
cd client
npm install
npm start
```

Frontend mặc định chạy tại:

```bash
http://localhost:3000
```

---

## 3. Cài đặt Backend

```bash
cd ../server
npm install
npm run dev
```

Backend mặc định chạy tại:

```bash
http://localhost:5000
```

---

#  Cấu hình Database

Tạo database MySQL:

```sql
CREATE DATABASE fnb;
```

Sau đó import file SQL của dự án vào MySQL.

---

#  Cấu hình môi trường

## Backend `.env`

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fnb

JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=your_key
```

---

## Frontend `.env`

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

---

#  Firebase Authentication (đang trong quá trình phát triển)

1. Tạo project trên Firebase
2. Bật Google Authentication
3. Tải file service account JSON
4. Đặt vào thư mục:

```bash
server/firebase-service-account.json
```

---

#  Deploy (đang trong quá trình phát triển)

## Frontend

Có thể deploy bằng:

* Firebase Hosting (đang trong quá trình phát triển)

## Backend

Có thể deploy bằng:

* Render (đang trong quá trình phát triển)
* Railway (đang trong quá trình phát triển)

---

#  Hướng phát triển thêm 

* Chat realtime hỗ trợ khách hàng
* Dashboard thống kê nâng cao
* Gợi ý món bằng AI
* Tối ưu responsive mobile
* Notification realtime
* Hệ thống phân quyền nâng cao

---

# Một số hình ảnh demo trong dự án
 - Ảnh form đăng nhập chính
 <img width="1881" height="972" alt="image" src="https://github.com/user-attachments/assets/79f46726-e371-452d-87c6-5aefa742bde7" />
 - Ảnh trang chủ
<img width="1860" height="973" alt="image" src="https://github.com/user-attachments/assets/456e160b-47c7-434b-bf1c-0697d2ba2630" />
 - Ảnh trang sản phẩm
<img width="1883" height="952" alt="image" src="https://github.com/user-attachments/assets/be5810e5-13bb-44c8-82b7-96ecfaef4282" />
 - Ảnh trang giỏ hàng
<img width="1871" height="969" alt="image" src="https://github.com/user-attachments/assets/c3e91317-931a-4027-9e3a-1ece5ded9ec8" />
 - Ảnh phân quyền người dùng
<img width="1886" height="962" alt="image" src="https://github.com/user-attachments/assets/f98d8696-7c7f-4a79-852c-71a5455bfbb5" />
 - Ảnh tạo và gửi voucher
<img width="1861" height="956" alt="image" src="https://github.com/user-attachments/assets/2978fae5-c719-413e-b481-ad858b248c06" />
 - Ảnh form thanh toán cho user
 <img width="1874" height="968" alt="image" src="https://github.com/user-attachments/assets/9f6b3455-15a5-4baa-abcc-372db8afc79c" />
 - Ảnh thanh toán online thông qua Sepay
<img width="1884" height="971" alt="image" src="https://github.com/user-attachments/assets/899e6a7e-7331-4d7f-8579-4b5f54b5ea2d" />








#  Thông tin dự án

Dự án được thực hiện nhằm mục thực tập và nâng cao phát triển kỹ năng Fullstack Web Development.

GitHub:

```bash
https://github.com/tuananh05112005
```

---
