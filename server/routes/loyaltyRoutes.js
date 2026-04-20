const router = require("express").Router();

const ctrl = require("../controllers/loyaltyController");

router.post("/add-points", ctrl.addPoints);
router.put("/notifications/read/:user_id", ctrl.markNotificationsRead);
router.get("/:user_id", ctrl.wallet);

module.exports = router;
