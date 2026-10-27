const express = require("express");
const { auth } = require("../middleware/auth");
const blockchain = require("../utils/blockchain");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "medical-marketplace-api" });
});

router.get("/blockchain", auth, async (req, res) => {
  const status = await blockchain.getStatus();
  res.json(status);
});

module.exports = router;
