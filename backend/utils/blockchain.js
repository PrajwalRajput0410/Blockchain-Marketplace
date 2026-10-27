const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const abi = require("./abi");

function loadAddress() {
  if (process.env.CONTRACT_ADDRESS) {
    return process.env.CONTRACT_ADDRESS;
  }
  const file = path.join(__dirname, "..", "contract-address.json");
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data.address;
  }
  return "";
}

function getContract() {
  const rpc = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const address = loadAddress();

  if (!address) {
    throw new Error(
      "Contract address missing. Deploy the contract and set CONTRACT_ADDRESS."
    );
  }
  if (!privateKey) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is missing.");
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(address, abi, wallet);
  return { provider, wallet, contract, address };
}

async function getStatus() {
  try {
    const { provider, contract, address, wallet } = getContract();
    const network = await provider.getNetwork();
    const datasetCount = await contract.datasetCount();
    const requestCount = await contract.requestCount();
    return {
      connected: true,
      contractAddress: address,
      chainId: Number(network.chainId),
      signer: wallet.address,
      datasetCount: Number(datasetCount),
      requestCount: Number(requestCount),
      note: "On-chain writes use the local Hardhat signer. Payments are simulated.",
    };
  } catch (error) {
    return {
      connected: false,
      contractAddress: loadAddress() || null,
      error: error.message,
    };
  }
}

async function registerDataset({ providerId, title, fileHash, priceInr }) {
  const { contract } = getContract();
  const tx = await contract.registerDataset(
    providerId,
    title,
    fileHash,
    priceInr
  );
  const receipt = await tx.wait();
  const count = await contract.datasetCount();
  return {
    txHash: receipt.hash,
    blockchainDatasetId: Number(count),
  };
}

async function requestAccess({ datasetId, researcherId }) {
  const { contract } = getContract();
  const tx = await contract.requestAccess(datasetId, researcherId);
  const receipt = await tx.wait();
  const count = await contract.requestCount();
  return {
    txHash: receipt.hash,
    blockchainRequestId: Number(count),
  };
}

async function updateConsent({ requestId, status }) {
  const { contract } = getContract();
  const tx = await contract.updateConsent(requestId, status);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function recordPayment({ requestId }) {
  const { contract } = getContract();
  const tx = await contract.recordPayment(requestId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function verifyHash({ datasetId, fileHash }) {
  const { contract } = getContract();
  const onChain = await contract.getDataset(datasetId);
  const matches = await contract.verifyHash(datasetId, fileHash);
  return {
    matches,
    onChainHash: onChain.fileHash,
    onChainTitle: onChain.title,
    providerId: onChain.providerId,
    timestamp: Number(onChain.timestamp),
  };
}

module.exports = {
  getStatus,
  registerDataset,
  requestAccess,
  updateConsent,
  recordPayment,
  verifyHash,
  loadAddress,
};
