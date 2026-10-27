const express = require("express");
const { body, validationResult } = require("express-validator");
const Dataset = require("../models/Dataset");
const AccessRequest = require("../models/AccessRequest");
const Transaction = require("../models/Transaction");
const { auth, allowRoles } = require("../middleware/auth");
const blockchain = require("../utils/blockchain");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "researcher") {
      filter.researcher = req.user._id;
    } else if (req.user.role === "hospital" || req.user.role === "laboratory") {
      const datasets = await Dataset.find({ provider: req.user._id }).select("_id");
      filter.dataset = { $in: datasets.map((d) => d._id) };
    }
    const requests = await AccessRequest.find(filter)
      .populate("researcher", "name email organization")
      .populate({
        path: "dataset",
        populate: { path: "provider", select: "name organization role" },
      })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Could not load requests.", error: error.message });
  }
});

router.post(
  "/",
  auth,
  allowRoles("researcher"),
  [body("datasetId").notEmpty(), body("purpose").trim().isLength({ min: 10 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Please describe your research purpose (min 10 characters)." });
    }
    try {
      const dataset = await Dataset.findById(req.body.datasetId);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found." });
      }
      const existing = await AccessRequest.findOne({
        dataset: dataset._id,
        researcher: req.user._id,
      });
      if (existing) {
        return res.status(400).json({ message: "You already requested this dataset." });
      }

      const accessRequest = await AccessRequest.create({
        dataset: dataset._id,
        researcher: req.user._id,
        purpose: req.body.purpose,
      });

      if (dataset.blockchainDatasetId) {
        try {
          const chain = await blockchain.requestAccess({
            datasetId: dataset.blockchainDatasetId,
            researcherId: req.user._id.toString(),
          });
          accessRequest.blockchainRequestId = chain.blockchainRequestId;
          accessRequest.requestTxHash = chain.txHash;
          await accessRequest.save();
          await Transaction.create({
            type: "request",
            actor: req.user._id,
            dataset: dataset._id,
            accessRequest: accessRequest._id,
            txHash: chain.txHash,
            details: "Access requested",
            onChain: true,
          });
        } catch (chainError) {
          await Transaction.create({
            type: "request",
            actor: req.user._id,
            dataset: dataset._id,
            accessRequest: accessRequest._id,
            details: `Off-chain request: ${chainError.message}`,
            onChain: false,
          });
        }
      }

      const populated = await accessRequest.populate([
        { path: "researcher", select: "name email organization" },
        { path: "dataset" },
      ]);
      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: "Could not create request.", error: error.message });
    }
  }
);

router.put(
  "/:id/consent",
  auth,
  allowRoles("hospital", "laboratory"),
  [body("decision").isIn(["approved", "rejected"])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Decision must be approved or rejected." });
    }
    try {
      const accessRequest = await AccessRequest.findById(req.params.id).populate("dataset");
      if (!accessRequest) {
        return res.status(404).json({ message: "Request not found." });
      }
      if (accessRequest.dataset.provider.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only the dataset provider can decide consent." });
      }
      if (accessRequest.consentStatus !== "pending") {
        return res.status(400).json({ message: "This request was already decided." });
      }

      accessRequest.consentStatus = req.body.decision;
      if (accessRequest.blockchainRequestId) {
        try {
          const chain = await blockchain.updateConsent({
            requestId: accessRequest.blockchainRequestId,
            status: req.body.decision === "approved" ? 1 : 2,
          });
          accessRequest.consentTxHash = chain.txHash;
          await Transaction.create({
            type: "consent",
            actor: req.user._id,
            dataset: accessRequest.dataset._id,
            accessRequest: accessRequest._id,
            txHash: chain.txHash,
            details: `Consent ${req.body.decision}`,
            onChain: true,
          });
        } catch (chainError) {
          await Transaction.create({
            type: "consent",
            actor: req.user._id,
            dataset: accessRequest.dataset._id,
            accessRequest: accessRequest._id,
            details: `Consent saved off-chain: ${chainError.message}`,
            onChain: false,
          });
        }
      }
      await accessRequest.save();
      res.json(accessRequest);
    } catch (error) {
      res.status(500).json({ message: "Could not update consent.", error: error.message });
    }
  }
);

router.post("/:id/pay", auth, allowRoles("researcher"), async (req, res) => {
  try {
    const accessRequest = await AccessRequest.findById(req.params.id).populate("dataset");
    if (!accessRequest) {
      return res.status(404).json({ message: "Request not found." });
    }
    if (accessRequest.researcher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "This is not your request." });
    }
    if (accessRequest.consentStatus !== "approved") {
      return res.status(400).json({ message: "Provider consent is required before payment." });
    }
    if (accessRequest.paymentStatus === "paid") {
      return res.status(400).json({ message: "Payment is already recorded." });
    }

    accessRequest.paymentStatus = "paid";
    accessRequest.paidAt = new Date();

    if (accessRequest.blockchainRequestId) {
      try {
        const chain = await blockchain.recordPayment({
          requestId: accessRequest.blockchainRequestId,
        });
        accessRequest.paymentTxHash = chain.txHash;
        await Transaction.create({
          type: "payment",
          actor: req.user._id,
          dataset: accessRequest.dataset._id,
          accessRequest: accessRequest._id,
          txHash: chain.txHash,
          details: `Simulated payment of INR ${accessRequest.dataset.priceInr}`,
          onChain: true,
        });
      } catch (chainError) {
        await Transaction.create({
          type: "payment",
          actor: req.user._id,
          dataset: accessRequest.dataset._id,
          accessRequest: accessRequest._id,
          details: `Simulated payment stored off-chain: ${chainError.message}`,
          onChain: false,
        });
      }
    }

    await accessRequest.save();
    res.json({
      message: "Simulated payment successful. You can now download the dataset.",
      accessRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Payment failed.", error: error.message });
  }
});

module.exports = router;
