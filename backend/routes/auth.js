const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");


// POST /login - Authenticate user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Find user by email using MongoDB (Mongoose)
    const User = require('../models/User');
    const user = await User.findOne({ email: cleanEmail }).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Return basic user info (excluding password)
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

module.exports = router;
