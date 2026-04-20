// routes/statsRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/statsController");

router.get("/admin/revenue", ctrl.revenue);
router.get("/admin/statistics", ctrl.overview);

module.exports = router;
