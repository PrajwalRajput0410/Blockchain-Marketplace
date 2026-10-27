const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
    },
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purpose: { type: String, required: true },
    consentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    blockchainRequestId: { type: Number, default: null },
    requestTxHash: { type: String, default: "" },
    consentTxHash: { type: String, default: "" },
    paymentTxHash: { type: String, default: "" },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

accessRequestSchema.index({ dataset: 1, researcher: 1 }, { unique: true });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
