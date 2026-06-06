// routes/authRoutes.js
const router = require("express").Router();
const auth = require("../controllers/authController");

// Dang nhap bang Google/Firebase.
router.post("/login/google", auth.googleLogin);

// Dang ky tai khoan moi.
router.post("/register", auth.register);

// Dang nhap bang email/password.
router.post("/login", auth.login);

module.exports = router;
