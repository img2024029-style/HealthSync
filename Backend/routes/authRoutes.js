const express = require("express");
const router = express.Router();
const { registerPatient, registerHospital, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register/patient", registerPatient);
router.post("/register/hospital", registerHospital);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
