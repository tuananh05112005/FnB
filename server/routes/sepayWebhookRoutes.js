const router = require("express").Router();

const { handleSepayWebhook } = require("../controllers/sepayWebhookController");

router.post("/webhook/sepay", handleSepayWebhook);
router.post("/sepay/webhook", handleSepayWebhook);
router.post("/sepay-webhook", handleSepayWebhook);

module.exports = router;
