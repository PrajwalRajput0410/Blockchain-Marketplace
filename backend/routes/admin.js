const express = require("express");
const User = require("../models/User");
const Dataset = require("../models/Dataset");
const AccessRequest = require("../models/AccessRequest");
const Transaction = require("../models/Transaction");
const { auth, allowRoles } = require("../middleware/auth");
const blockchain = require("../utils/blockchain");

const router = express.Router();

router.use(auth, allowRoles("admin"));

router.get("/stats", async (req, res) => {
  try {
    const [users, datasets, requests, paid, chain] = await Promise.all([
      User.countDocuments(),
      Dataset.countDocuments(),
      AccessRequest.countDocuments(),
      AccessRequest.countDocuments({ paymentStatus: "paid" }),
      blockchain.getStatus(),
    ]);
    res.json({ users, datasets, requests, paid, blockchain: chain });
  } catch (error) {
    res.status(500).json({ message: "Could not load stats." });
  }
});

router.get("/users", async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

router.get("/datasets", async (req, res) => {
  const datasets = await Dataset.find()
    .populate("provider", "name organization role")
    .sort({ createdAt: -1 });
  res.json(datasets);
});

router.get("/requests", async (req, res) => {
  const requests = await AccessRequest.find()
    .populate("researcher", "name email organization")
    .populate("dataset", "title priceInr")
    .sort({ createdAt: -1 });
  res.json(requests);
});

router.get("/transactions", async (req, res) => {
  const transactions = await Transaction.find()
    .populate("actor", "name role organization")
    .populate("dataset", "title sha256Hash")
    .sort({ createdAt: -1 });
  res.json(transactions);
});

module.exports = router;
