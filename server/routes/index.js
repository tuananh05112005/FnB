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
const statsRoutes = require("./statsRoutes");
const passwordRoutes = require("./passwordRoutes");
const productController = require("../controllers/productController");
const loyaltyController = require("../controllers/loyaltyController");

function registerRoutes(app) {
  app.use("/", authRoutes);

  app.use("/api", userRoutes);

  app.use("/api/products", productRoutes);
  app.get("/api/product-categories", productController.categories);
  app.get("/api/product/:id/history", productController.history);

  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/loyalty", loyaltyRoutes);
  app.put("/api/notifications/read/:user_id", loyaltyController.markNotificationsRead);
  app.use("/api/vouchers", voucherRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/admin", orderRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api", statsRoutes);
  app.use("/api", passwordRoutes);
}

module.exports = registerRoutes;
