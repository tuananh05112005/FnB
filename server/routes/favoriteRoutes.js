// routes/favoriteRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/favoriteController");

router.post("/", ctrl.add);
router.get("/:user_id", ctrl.list);
router.delete("/", ctrl.remove);

module.exports = router;
