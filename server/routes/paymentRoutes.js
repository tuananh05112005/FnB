// routes/paymentRoutes.js

const router = require("express").Router();

const ctrl = require("../controllers/paymentController");
const { handleSepayWebhook } = require("../controllers/sepayWebhookController");

/*
====================================================
CREATE PAYMENT
====================================================
*/

router.post(
  "/create",
  ctrl.create
);

/*
====================================================
GET PAYMENT STATUS
====================================================
*/

router.get(
  "/status/:id",
  ctrl.getPaymentStatus
);

/*
====================================================
SEPAY WEBHOOK
====================================================
*/

router.post(
  "/sepay-webhook",
  handleSepayWebhook
);

/*
====================================================
USER PAYMENT HISTORY
====================================================
*/

router.get(
  "/history/:user_id",
  ctrl.historyByUser
);

/*
====================================================
ADMIN LIST ALL PAYMENTS
====================================================
*/

router.get(
  "/admin/all",
  ctrl.adminList
);

/*
====================================================
ADMIN LIST PENDING PAYMENTS
====================================================
*/

router.get(
  "/admin/pending",
  ctrl.adminListPending
);

/*
====================================================
ADMIN CONFIRM BANKING PAYMENT
====================================================
*/

router.put(
  "/admin/confirm/:id",
  ctrl.adminConfirmPending
);

/*
====================================================
DELETE PAYMENT
====================================================
*/

router.delete(
  "/:payment_id",
  ctrl.remove
);

module.exports = router;
