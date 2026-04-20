const router = require("express").Router();

const orders = require("../controllers/orderController");
const payments = require("../controllers/paymentController");
const stats = require("../controllers/statsController");

router.get("/orders", orders.adminListOrders);
router.put("/orders/:id/status", orders.adminUpdateStatus);

router.get("/payments", payments.adminList);
router.get("/payments/pending", payments.adminListPending);
router.put("/payments/pending/:id/confirm", payments.adminConfirmPending);
router.delete("/payments/:id", payments.adminDelete);

router.get("/revenue", stats.revenue);
router.get("/statistics", stats.overview);

module.exports = router;
