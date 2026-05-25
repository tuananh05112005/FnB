const router = require("express").Router();

const { handleSepayWebhook } = require("../controllers/sepayWebhookController");

router.post("/webhook/sepay", handleSepayWebhook);

module.exports = router;
