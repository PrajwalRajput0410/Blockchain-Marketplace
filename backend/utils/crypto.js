const crypto = require("crypto");

function getKey() {
  const hex = process.env.AES_SECRET_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "AES_SECRET_KEY must be a 64-character hex string (32 bytes) for AES-256"
    );
  }
  return Buffer.from(hex, "hex");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString("hex"), encrypted };
}

function decryptBuffer(encrypted, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", getKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

module.exports = { sha256, encryptBuffer, decryptBuffer };
