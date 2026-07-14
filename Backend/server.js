require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

require("./models/User");
require("./models/Admin");
require("./models/Hospital");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "HealthSync API is running" });
});

// Route mounting
app.use("/api/auth", require("./routes/authRoutes"));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
