const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Marketplace = await hre.ethers.getContractFactory(
    "MedicalDataMarketplace"
  );
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  const payload = {
    address,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contractName: "MedicalDataMarketplace",
  };

  const blockchainFile = path.join(__dirname, "..", "contract-address.json");
  const backendFile = path.join(
    __dirname,
    "..",
    "..",
    "backend",
    "contract-address.json"
  );

  fs.writeFileSync(blockchainFile, JSON.stringify(payload, null, 2));
  fs.writeFileSync(backendFile, JSON.stringify(payload, null, 2));

  console.log("MedicalDataMarketplace deployed to:", address);
  console.log("Saved address to:");
  console.log(" -", blockchainFile);
  console.log(" -", backendFile);
  console.log("\nPut this value in backend/.env as CONTRACT_ADDRESS=");
  console.log(address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
