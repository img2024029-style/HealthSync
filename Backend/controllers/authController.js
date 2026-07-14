const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

const modelsByRole = {
  patient: User,
  hospital: Hospital,
  admin: Admin,
};

// Turns a Mongoose validation error into a flat list of field messages
const formatValidationError = (error) => {
  if (error.name === "ValidationError") {
    return Object.values(error.errors).map((e) => e.message);
  }
  return null;
};

// Mongo duplicate key error (unique index clash: email, mobileNumber, registrationNumber...)
const formatDuplicateKeyError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return `${field} is already registered`;
  }
  return null;
};

// ---------------------------------------------------------------------------
// POST /api/auth/register/patient
// Required by Backend/models/User.js: fullName.firstName, fullName.lastName,
// email, mobileNumber, password
// ---------------------------------------------------------------------------
const registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, password } = req.body;

    const user = await User.create({
      fullName: { firstName, lastName },
      email,
      mobileNumber,
      password,
    });

    const token = generateToken({ id: user._id, role: "patient" });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        role: "patient",
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
      },
    });
  } catch (error) {
    const validationMessages = formatValidationError(error);
    const duplicateMessage = formatDuplicateKeyError(error);

    if (validationMessages) {
      return res.status(400).json({ success: false, message: validationMessages[0], errors: validationMessages });
    }
    if (duplicateMessage) {
      return res.status(409).json({ success: false, message: duplicateMessage });
    }
    console.error("registerPatient error:", error);
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/register/hospital
// Required by Backend/models/Hospital.js: name, email, mobileNumber, password,
// registrationNumber, hospitalType, address.{street,city,state,pincode}
// ---------------------------------------------------------------------------
const registerHospital = async (req, res) => {
  try {
    const {
      name,
      email,
      mobileNumber,
      password,
      registrationNumber,
      hospitalType,
      street,
      city,
      state,
      pincode,
      country,
      specialities,
      totalBeds,
      emergencyAvailable,
      website,
    } = req.body;

    const hospital = await Hospital.create({
      name,
      email,
      mobileNumber,
      password,
      registrationNumber,
      hospitalType,
      address: { street, city, state, pincode, country },
      specialities,
      totalBeds,
      emergencyAvailable,
      website,
    });

    const token = generateToken({ id: hospital._id, role: "hospital" });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: hospital._id,
        role: "hospital",
        name: hospital.name,
        email: hospital.email,
        mobileNumber: hospital.mobileNumber,
        registrationNumber: hospital.registrationNumber,
        hospitalType: hospital.hospitalType,
        address: hospital.address,
      },
    });
  } catch (error) {
    const validationMessages = formatValidationError(error);
    const duplicateMessage = formatDuplicateKeyError(error);

    if (validationMessages) {
      return res.status(400).json({ success: false, message: validationMessages[0], errors: validationMessages });
    }
    if (duplicateMessage) {
      return res.status(409).json({ success: false, message: duplicateMessage });
    }
    console.error("registerHospital error:", error);
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login   { email, password, role }
// ---------------------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const Model = modelsByRole[role];
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid role. Use 'patient', 'hospital' or 'admin'." });
    }
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const account = await Model.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!account) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (role === "hospital" && account.isActive === false) {
      return res.status(403).json({ success: false, message: "This hospital account has been deactivated" });
    }

    const token = generateToken({ id: account._id, role });
    const sanitized = account.toObject();
    delete sanitized.password;

    res.status(200).json({ success: true, token, user: { ...sanitized, role } });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me  (protected)
// ---------------------------------------------------------------------------
const getMe = async (req, res) => {
  const sanitized = req.user.toObject();
  delete sanitized.password;
  res.status(200).json({ success: true, user: { ...sanitized, role: req.role } });
};

module.exports = { registerPatient, registerHospital, login, getMe };
