// ==============================================================
// TÊN FILE: index.js (Routes)
// MÔ TẢ: Điểm đăng ký định tuyến tập trung cho toàn bộ hệ thống API backend.
//        - Gom và khai báo tất cả các file route con (auth, user, products, cart, payments, v.v.).
//        - exports hàm `registerRoutes` để nạp các định tuyến vào Express App khi khởi động Server.
// ==============================================================

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const favoriteRoutes = require("./favoriteRoutes");
const reviewRoutes = require("./reviewRoutes");
const loyaltyRoutes = require("./loyaltyRoutes");
const voucherRoutes = require("./voucherRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const sepayWebhookRoutes = require("./sepayWebhookRoutes");
const statsRoutes = require("./statsRoutes");
const passwordRoutes = require("./passwordRoutes");
const categorySettingsRoutes = require("./categorySettings");
const productController = require("../controllers/productController");
const loyaltyController = require("../controllers/loyaltyController");
const aiRoutes = require("./aiRoutes");
const converationsRoutes = require("./conversationsRoutes");

// Đăng ký toàn bộ các định tuyến API nhóm theo phân hệ chức năng
function registerRoutes(app) {
  app.use("/", authRoutes); // Các endpoint xác thực chung (/login, /register, v.v.)

  app.use("/api", userRoutes); // Quản lý thông tin user

  app.use("/api/products", productRoutes); // CRUD và tra cứu sản phẩm/món ăn
  app.get("/api/product-categories", productController.categories); // Lấy danh sách danh mục sản phẩm
  app.get("/api/product/:id/history", productController.history); // Nhật ký chỉnh sửa món ăn của admin

  app.use("/api/favorites", favoriteRoutes); // Danh sách yêu thích của khách hàng
  app.use("/api/reviews", reviewRoutes);     // Đánh giá/bình luận sản phẩm
  app.use("/api/loyalty", loyaltyRoutes);     // Điểm tích lũy và ví ưu đãi của khách hàng
  app.put("/api/notifications/read/:user_id", loyaltyController.markNotificationsRead); // Đọc toàn bộ thông báo
  app.put("/api/notifications/read-single/:id", loyaltyController.markSingleNotificationRead); // Đọc từng thông báo cụ thể
  app.use("/api/vouchers", voucherRoutes); // Quản lý và đổi mã giảm giá/voucher
  app.use("/api/cart", cartRoutes);        // Logic giỏ hàng, đặt đơn hàng, hủy đơn
  app.use("/api/admin", orderRoutes);      // Quản lý đơn hàng dành cho Admin (Cập nhật trạng thái)
  app.use("/", sepayWebhookRoutes);        // Webhook tiếp nhận tự động từ ngân hàng / cổng SePay
  app.use("/api/payments", paymentRoutes);  // Lịch sử giao dịch và cổng thanh toán
  app.use("/api", sepayWebhookRoutes);
  app.use("/api", statsRoutes);            // Thống kê số liệu doanh thu / sản phẩm bán chạy cho Admin
  app.use("/api", passwordRoutes);         // Đổi mật khẩu và gửi OTP khôi phục mật khẩu qua Gmail

  app.use("/api/category-settings", categorySettingsRoutes); // Cài đặt ẩn hiện, thứ tự danh mục sản phẩm
  app.use("/api/ai", aiRoutes);            // Tích hợp Chatbot AI Gemini tư vấn sản phẩm
  app.use("/api/conversations", converationsRoutes); // Quản lý lịch sử cuộc hội thoại AI
  app.use("/api/upload", require("./uploadRoutes")); // Tải ảnh lên cục bộ
}

module.exports = registerRoutes;
