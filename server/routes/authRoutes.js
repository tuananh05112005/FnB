// routes/authRoutes.js
const router = require("express").Router();
const auth = require("../controllers/authController");

router.post("/login/google", auth.googleLogin);
router.post("/register", auth.register);
router.post("/login", auth.login);

module.exports = router;
