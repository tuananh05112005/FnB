// routes/voucherRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/voucherController");

router.post("/", ctrl.create);
router.get("/", ctrl.listValid);
router.post("/redeem", ctrl.redeem);
router.post("/validate", ctrl.validate);
router.post("/assign", ctrl.assign);

module.exports = router;
