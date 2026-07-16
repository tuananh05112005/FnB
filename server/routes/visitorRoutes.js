// routes/visitorRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/visitorController");

router.post("/track-visit", ctrl.trackVisit);
router.get("/visitor-logs", ctrl.getVisitorLogs);

module.exports = router;
