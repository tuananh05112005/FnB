const router = require("express").Router();

const ctrl = require("../controllers/userController");

router.get("/users/all", ctrl.getAll);
router.put("/users/:id/role", ctrl.updateRole);
router.delete("/users/:id", ctrl.remove);
router.put("/users/:id", ctrl.update);
router.put("/users/:id/status", ctrl.updateStatus);

router.post("/admin/create-staff", ctrl.createStaff);
router.get("/staffs", ctrl.getStaffs);

module.exports = router;
