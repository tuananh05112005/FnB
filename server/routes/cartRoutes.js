// routes/cartRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/cartController");

router.post("/add", ctrl.add);
router.get("/:user_id", ctrl.listByUser);
router.put("/update/:id", ctrl.updateQty);
router.put("/update-status/:id", ctrl.updateStatus);
router.put("/checkout-item/:id", ctrl.checkoutItem);
router.put("/received/:id", ctrl.received);
router.put("/cancel/:id", ctrl.cancel);

module.exports = router;
