const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Dataset = require("../models/Dataset");
const AccessRequest = require("../models/AccessRequest");
const Transaction = require("../models/Transaction");
const { sha256, encryptBuffer } = require("./crypto");
const blockchain = require("./blockchain");

const uploadsDir = path.join(__dirname, "..", "uploads");

async function encryptSample(relativeFile, provider, meta) {
  const source = path.join(__dirname, "..", "sample-data", relativeFile);
  const buffer = fs.readFileSync(source);
  const hash = sha256(buffer);
  const { iv, encrypted } = encryptBuffer(buffer);
  const destName = `${Date.now()}-${relativeFile}.enc`;
  const dest = path.join(uploadsDir, destName);
  fs.writeFileSync(dest, encrypted);

  const dataset = await Dataset.create({
    ...meta,
    originalFileName: relativeFile,
    mimeType: relativeFile.endsWith(".json") ? "application/json" : "text/csv",
    encryptedPath: dest,
    iv,
    sha256Hash: hash,
    provider: provider._id,
  });

  try {
    const chain = await blockchain.registerDataset({
      providerId: provider._id.toString(),
      title: dataset.title,
      fileHash: hash,
      priceInr: dataset.priceInr,
    });
    dataset.blockchainDatasetId = chain.blockchainDatasetId;
    dataset.registerTxHash = chain.txHash;
    await dataset.save();
    await Transaction.create({
      type: "register",
      actor: provider._id,
      dataset: dataset._id,
      txHash: chain.txHash,
      details: `Seed registered ${dataset.title}`,
      onChain: true,
    });
  } catch (error) {
    console.warn("Blockchain register skipped:", error.message);
    await Transaction.create({
      type: "register",
      actor: provider._id,
      dataset: dataset._id,
      details: `Seed saved off-chain: ${error.message}`,
      onChain: false,
    });
  }
  return dataset;
}

async function seedData({ reset = false } = {}) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!reset) {
    const existing = await User.countDocuments();
    if (existing > 0) {
      return false;
    }
  }

  await Promise.all([
    User.deleteMany({}),
    Dataset.deleteMany({}),
    AccessRequest.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const password = await bcrypt.hash("Password@123", 10);
  const [admin, hospital, lab, researcher] = await User.create([
    {
      name: "Marketplace Admin",
      email: "admin@marketplace.com",
      password,
      role: "admin",
      organization: "Marketplace Control Room",
    },
    {
      name: "Dr. Ananya Rao",
      email: "hospital@citycare.com",
      password,
      role: "hospital",
      organization: "CityCare Hospital",
    },
    {
      name: "Rahul Mehta",
      email: "lab@genelab.com",
      password,
      role: "laboratory",
      organization: "GeneLab Diagnostics",
    },
    {
      name: "Priya Sharma",
      email: "researcher@uni.edu",
      password,
      role: "researcher",
      organization: "National Institute of Health Informatics",
    },
  ]);

  const diabetes = await encryptSample("synthetic_diabetes_study.csv", hospital, {
    title: "Synthetic Type 2 Diabetes Outcomes Study",
    description:
      "De-identified synthetic cohort used to demonstrate diabetes research sharing. Age bands, HbA1c bands, and medication classes only. No real patients.",
    category: "Clinical Outcomes",
    diseaseArea: "Type 2 Diabetes",
    sampleSize: 10,
    priceInr: 2500,
  });

  await encryptSample("synthetic_cardiology_cohort.csv", hospital, {
    title: "Synthetic Cardiology Risk Cohort",
    description:
      "Synthetic cardiovascular risk markers with blood-pressure and LDL bands. Created only for classroom demonstration.",
    category: "Epidemiology",
    diseaseArea: "Cardiology",
    sampleSize: 10,
    priceInr: 3200,
  });

  await encryptSample("synthetic_lab_biomarkers.json", lab, {
    title: "Synthetic Inflammatory Biomarker Panel",
    description:
      "Synthetic laboratory assay results (CRP, IL-6, D-dimer, ferritin) with result bands instead of identifiable values.",
    category: "Laboratory",
    diseaseArea: "Inflammation",
    sampleSize: 5,
    priceInr: 1800,
  });

  const request = await AccessRequest.create({
    dataset: diabetes._id,
    researcher: researcher._id,
    purpose: "Classroom analysis of anonymized diabetes treatment patterns.",
  });

  if (diabetes.blockchainDatasetId) {
    try {
      const chain = await blockchain.requestAccess({
        datasetId: diabetes.blockchainDatasetId,
        researcherId: researcher._id.toString(),
      });
      request.blockchainRequestId = chain.blockchainRequestId;
      request.requestTxHash = chain.txHash;
      await request.save();
    } catch (error) {
      console.warn("Seed request on-chain skipped:", error.message);
    }
  }

  console.log("Seed complete. Demo logins (password: Password@123):");
  console.log("  Admin      admin@marketplace.com");
  console.log("  Hospital   hospital@citycare.com");
  console.log("  Laboratory lab@genelab.com");
  console.log("  Researcher researcher@uni.edu");
  return true;
}

module.exports = { seedData };
