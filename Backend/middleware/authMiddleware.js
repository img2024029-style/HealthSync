const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Admin = require("../models/Admin");

const modelsByRole = {
  patient: User,
  hospital: Hospital,
  admin: Admin,
};

/**
 * Verifies the Bearer token, loads the matching account (by role) and
 * attaches it to req.user / req.role. Rejects with 401 if anything is off.
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = modelsByRole[decoded.role];

    if (!Model) {
      return res.status(401).json({ success: false, message: "Not authorized, invalid token role" });
    }

    const account = await Model.findById(decoded.id);
    if (!account) {
      return res.status(401).json({ success: false, message: "Not authorized, account no longer exists" });
    }

    req.user = account;
    req.role = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
  }
};

/**
 * Restricts a route to specific roles, e.g. authorize("hospital", "admin").
 * Must run after `protect`.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.role)) {
    return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions" });
  }
  next();
};

module.exports = { protect, authorize };
