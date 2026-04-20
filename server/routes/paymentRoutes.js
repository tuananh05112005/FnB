// routes/paymentRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/paymentController");

router.post("/", ctrl.create);
router.get("/banking-status/:pending_payment_id", ctrl.getBankingStatus);
router.post("/banking-finalize", ctrl.finalizeBankingPayment);
router.get("/history/:user_id", ctrl.historyByUser);
router.delete("/:payment_id", ctrl.remove);

module.exports = router;
