const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalDataMarketplace", function () {
  async function deployMarketplace() {
    const Factory = await ethers.getContractFactory("MedicalDataMarketplace");
    const marketplace = await Factory.deploy();
    await marketplace.waitForDeployment();
    return marketplace;
  }

  it("registers a dataset hash and verifies integrity", async function () {
    const marketplace = await deployMarketplace();
    const tx = await marketplace.registerDataset(
      "hospital-1",
      "Synthetic Diabetes Study",
      "abc123hash",
      2500
    );
    await tx.wait();

    expect(await marketplace.datasetCount()).to.equal(1n);

    const record = await marketplace.getDataset(1);
    expect(record.providerId).to.equal("hospital-1");
    expect(record.fileHash).to.equal("abc123hash");
    expect(record.priceInr).to.equal(2500n);
    expect(await marketplace.verifyHash(1, "abc123hash")).to.equal(true);
    expect(await marketplace.verifyHash(1, "tampered")).to.equal(false);
  });

  it("stores access requests, consent, and a simulated payment flag", async function () {
    const marketplace = await deployMarketplace();
    await marketplace.registerDataset("lab-1", "Biomarkers", "hash-1", 1800);
    await marketplace.requestAccess(1, "researcher-1");

    expect(await marketplace.requestCount()).to.equal(1n);

    let request = await marketplace.getRequest(1);
    expect(request.consentStatus).to.equal(0);
    expect(request.paymentRecorded).to.equal(false);

    await expect(marketplace.recordPayment(1)).to.be.revertedWith(
      "Consent not approved"
    );

    await marketplace.updateConsent(1, 1);
    await marketplace.recordPayment(1);

    request = await marketplace.getRequest(1);
    expect(request.consentStatus).to.equal(1);
    expect(request.paymentRecorded).to.equal(true);
  });

  it("rejects invalid consent values", async function () {
    const marketplace = await deployMarketplace();
    await marketplace.registerDataset("p1", "Title", "h1", 100);
    await marketplace.requestAccess(1, "r1");
    await expect(marketplace.updateConsent(1, 9)).to.be.revertedWith(
      "Status must be 1 or 2"
    );
  });
});
