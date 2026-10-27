const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Dataset = require("../models/Dataset");
const AccessRequest = require("../models/AccessRequest");
const Transaction = require("../models/Transaction");
const { auth, allowRoles } = require("../middleware/auth");
const { sha256, encryptBuffer, decryptBuffer } = require("../utils/crypto");
const blockchain = require("../utils/blockchain");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/json",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|json|txt|xlsx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV, JSON, TXT, or XLSX files are allowed."));
    }
  },
});

router.get("/", auth, async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { diseaseArea: new RegExp(q, "i") },
      ];
    }
    const datasets = await Dataset.find(filter)
      .populate("provider", "name organization role")
      .sort({ createdAt: -1 });
    res.json(datasets);
  } catch (error) {
    res.status(500).json({ message: "Could not load datasets.", error: error.message });
  }
});

router.get("/mine", auth, allowRoles("hospital", "laboratory"), async (req, res) => {
  try {
    const datasets = await Dataset.find({ provider: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(datasets);
  } catch (error) {
    res.status(500).json({ message: "Could not load your datasets." });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id).populate(
      "provider",
      "name organization role email"
    );
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found." });
    }
    let access = null;
    if (req.user.role === "researcher") {
      access = await AccessRequest.findOne({
        dataset: dataset._id,
        researcher: req.user._id,
      });
    }
    res.json({ dataset, access });
  } catch (error) {
    res.status(500).json({ message: "Could not load dataset." });
  }
});

router.post(
  "/",
  auth,
  allowRoles("hospital", "laboratory"),
  upload.single("file"),
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Title is required"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Please add a longer description"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("diseaseArea").trim().notEmpty().withMessage("Disease area is required"),
    body("sampleSize").isInt({ min: 1 }).withMessage("Sample size must be a number"),
    body("priceInr").isFloat({ min: 0 }).withMessage("Price must be 0 or more"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please attach a dataset file." });
    }
    try {
      const hash = sha256(req.file.buffer);
      const { iv, encrypted } = encryptBuffer(req.file.buffer);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.enc`;
      const dest = path.join(__dirname, "..", "uploads", fileName);
      fs.writeFileSync(dest, encrypted);

      const dataset = await Dataset.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        diseaseArea: req.body.diseaseArea,
        sampleSize: Number(req.body.sampleSize),
        priceInr: Number(req.body.priceInr),
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        encryptedPath: dest,
        iv,
        sha256Hash: hash,
        provider: req.user._id,
      });

      try {
        const chain = await blockchain.registerDataset({
          providerId: req.user._id.toString(),
          title: dataset.title,
          fileHash: hash,
          priceInr: dataset.priceInr,
        });
        dataset.blockchainDatasetId = chain.blockchainDatasetId;
        dataset.registerTxHash = chain.txHash;
        await dataset.save();
        await Transaction.create({
          type: "register",
          actor: req.user._id,
          dataset: dataset._id,
          txHash: chain.txHash,
          details: `Registered hash ${hash}`,
          onChain: true,
        });
      } catch (chainError) {
        await Transaction.create({
          type: "register",
          actor: req.user._id,
          dataset: dataset._id,
          details: `Saved off-chain only: ${chainError.message}`,
          onChain: false,
        });
      }

      res.status(201).json(dataset);
    } catch (error) {
      res.status(500).json({ message: "Upload failed.", error: error.message });
    }
  }
);

router.get("/:id/download", auth, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found." });
    }

    const isProvider = dataset.provider.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    let allowed = isProvider || isAdmin;

    if (!allowed && req.user.role === "researcher") {
      const access = await AccessRequest.findOne({
        dataset: dataset._id,
        researcher: req.user._id,
        consentStatus: "approved",
        paymentStatus: "paid",
      });
      allowed = Boolean(access);
    }

    if (!allowed) {
      return res.status(403).json({
        message:
          "Download is allowed only after consent approval and simulated payment.",
      });
    }

    const encrypted = fs.readFileSync(dataset.encryptedPath);
    const decrypted = decryptBuffer(encrypted, dataset.iv);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${dataset.originalFileName}"`
    );
    res.setHeader("Content-Type", dataset.mimeType || "application/octet-stream");
    res.send(decrypted);
  } catch (error) {
    res.status(500).json({ message: "Download failed.", error: error.message });
  }
});

router.post("/:id/verify", auth, upload.single("file"), async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found." });
    }
    let hash = (req.body.hash || "").trim().toLowerCase();
    if (req.file) {
      hash = sha256(req.file.buffer);
    }
    if (!hash) {
      return res.status(400).json({ message: "Upload a file or paste a SHA-256 hash." });
    }

    const dbMatch = hash === dataset.sha256Hash;
    let chainResult = null;
    if (dataset.blockchainDatasetId) {
      try {
        chainResult = await blockchain.verifyHash({
          datasetId: dataset.blockchainDatasetId,
          fileHash: hash,
        });
      } catch (error) {
        chainResult = { error: error.message };
      }
    }

    await Transaction.create({
      type: "verify",
      actor: req.user._id,
      dataset: dataset._id,
      details: `Hash ${hash} dbMatch=${dbMatch} chain=${JSON.stringify(chainResult)}`,
      onChain: Boolean(chainResult && chainResult.matches),
    });

    res.json({
      providedHash: hash,
      storedHash: dataset.sha256Hash,
      databaseMatch: dbMatch,
      blockchain: chainResult,
    });
  } catch (error) {
    res.status(500).json({ message: "Verification failed.", error: error.message });
  }
});

module.exports = router;
