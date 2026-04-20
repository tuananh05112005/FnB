// routes/passwordRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/passwordController");

router.post("/send-otp", ctrl.sendOTP);
router.post("/reset-password", ctrl.resetPassword);

module.exports = router;
