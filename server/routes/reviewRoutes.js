const router = require("express").Router();

const ctrl = require("../controllers/reviewController");

router.post("/", ctrl.create);
router.get("/average/:product_id", ctrl.averageLegacy);
router.get("/:product_id/average", ctrl.average);
router.get("/:product_id", ctrl.listByProduct);

module.exports = router;
