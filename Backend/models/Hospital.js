const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
      minlength: [3, "Hospital name must be at least 3 characters"],
      maxlength: [200, "Hospital name cannot exceed 200 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    mobileNumber: {
      type: String,
      required: [true, "Contact number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit mobile number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    registrationNumber: {
      // Government/medical council registration number
      type: String,
      required: [true, "Hospital registration number is required"],
      unique: true,
      trim: true,
    },
    hospitalType: {
      type: String,
      enum: ["government", "private", "trust", "clinic", "multi-speciality"],
      required: [true, "Hospital type is required"],
    },
    address: {
      street: { type: String, required: [true, "Street address is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "State is required"], trim: true },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^\d{6}$/, "Please provide a valid 6-digit pincode"],
      },
      country: { type: String, default: "India", trim: true },
    },
    specialities: {
      // e.g. ["Cardiology", "Orthopedics", "Neurology"]
      type: [String],
      default: [],
    },
    totalBeds: {
      type: Number,
      min: [0, "Total beds cannot be negative"],
      default: 0,
    },
    emergencyAvailable: {
      type: Boolean,
      default: false,
    },
    website: {
      type: String,
      trim: true,
    },
    isVerified: {
      // set true by admin after verifying registration details
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
hospitalSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with stored hash
hospitalSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Hospital", hospitalSchema);
