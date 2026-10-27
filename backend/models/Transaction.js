const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["register", "request", "consent", "payment", "verify"],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset" },
    accessRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRequest",
    },
    txHash: { type: String, default: "" },
    details: { type: String, default: "" },
    onChain: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
