const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    diseaseArea: { type: String, required: true },
    sampleSize: { type: Number, required: true, min: 1 },
    priceInr: { type: Number, required: true, min: 0 },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    encryptedPath: { type: String, required: true },
    iv: { type: String, required: true },
    sha256Hash: { type: String, required: true },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockchainDatasetId: { type: Number, default: null },
    registerTxHash: { type: String, default: "" },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dataset", datasetSchema);
