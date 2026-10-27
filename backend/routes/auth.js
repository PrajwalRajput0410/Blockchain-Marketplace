const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
  };
}

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("organization")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Organization is required"),
    body("role")
      .isIn(["hospital", "laboratory", "researcher"])
      .withMessage("Role must be hospital, laboratory, or researcher"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { name, email, password, organization, role } = req.body;
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: "Email is already registered." });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashed,
        organization,
        role,
      });
      const token = signToken(user);
      res.status(201).json({ token, user: publicUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Registration failed.", error: error.message });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password." });
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(400).json({ message: "Invalid email or password." });
      }
      const token = signToken(user);
      res.json({ token, user: publicUser(user) });
    } catch (error) {
      res.status(500).json({ message: "Login failed.", error: error.message });
    }
  }
);

router.get("/me", auth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
