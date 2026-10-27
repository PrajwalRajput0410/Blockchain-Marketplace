// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Medical Research Data Marketplace
 * ---------------------------------
 * This contract stores dataset integrity hashes, provider/researcher
 * identifiers, consent status, and payment RECORDS.
 *
 * Implemented on-chain:
 *   - Dataset hash registration
 *   - Access request records
 *   - Consent approve / reject
 *   - Payment record (a flag only — ETH is NOT transferred)
 *   - Hash verification
 *
 * Simulated off-chain (backend / UI):
 *   - Real money / UPI / card payments
 *   - File storage and AES-256 encryption
 *   - User login (JWT + MongoDB)
 */
contract MedicalDataMarketplace {
    address public owner;
    uint256 public datasetCount;
    uint256 public requestCount;

    struct DatasetRecord {
        uint256 id;
        string providerId;
        string title;
        string fileHash;
        uint256 priceInr;
        uint256 timestamp;
        bool exists;
    }

    struct AccessRecord {
        uint256 id;
        uint256 datasetId;
        string researcherId;
        uint8 consentStatus; // 0 = pending, 1 = approved, 2 = rejected
        bool paymentRecorded;
        uint256 timestamp;
    }

    mapping(uint256 => DatasetRecord) public datasets;
    mapping(uint256 => AccessRecord) public requests;
    mapping(string => uint256) public hashToDatasetId;

    event DatasetRegistered(
        uint256 indexed id,
        string providerId,
        string title,
        string fileHash,
        uint256 priceInr
    );
    event AccessRequested(
        uint256 indexed requestId,
        uint256 indexed datasetId,
        string researcherId
    );
    event ConsentUpdated(uint256 indexed requestId, uint8 status);
    event PaymentRecorded(uint256 indexed requestId, string researcherId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerDataset(
        string memory providerId,
        string memory title,
        string memory fileHash,
        uint256 priceInr
    ) external returns (uint256) {
        require(bytes(fileHash).length > 0, "Hash required");
        require(bytes(title).length > 0, "Title required");

        datasetCount += 1;
        datasets[datasetCount] = DatasetRecord({
            id: datasetCount,
            providerId: providerId,
            title: title,
            fileHash: fileHash,
            priceInr: priceInr,
            timestamp: block.timestamp,
            exists: true
        });
        hashToDatasetId[fileHash] = datasetCount;

        emit DatasetRegistered(datasetCount, providerId, title, fileHash, priceInr);
        return datasetCount;
    }

    function requestAccess(
        uint256 datasetId,
        string memory researcherId
    ) external returns (uint256) {
        require(datasets[datasetId].exists, "Dataset not found");
        require(bytes(researcherId).length > 0, "Researcher required");

        requestCount += 1;
        requests[requestCount] = AccessRecord({
            id: requestCount,
            datasetId: datasetId,
            researcherId: researcherId,
            consentStatus: 0,
            paymentRecorded: false,
            timestamp: block.timestamp
        });

        emit AccessRequested(requestCount, datasetId, researcherId);
        return requestCount;
    }

    function updateConsent(uint256 requestId, uint8 status) external {
        require(requests[requestId].id != 0, "Request not found");
        require(status == 1 || status == 2, "Status must be 1 or 2");
        requests[requestId].consentStatus = status;
        emit ConsentUpdated(requestId, status);
    }

    function recordPayment(uint256 requestId) external {
        AccessRecord storage accessRequest = requests[requestId];
        require(accessRequest.id != 0, "Request not found");
        require(accessRequest.consentStatus == 1, "Consent not approved");
        require(!accessRequest.paymentRecorded, "Already paid");
        accessRequest.paymentRecorded = true;
        emit PaymentRecorded(requestId, accessRequest.researcherId);
    }

    function verifyHash(
        uint256 datasetId,
        string memory fileHash
    ) external view returns (bool) {
        require(datasets[datasetId].exists, "Dataset not found");
        return
            keccak256(bytes(datasets[datasetId].fileHash)) ==
            keccak256(bytes(fileHash));
    }

    function getDataset(
        uint256 datasetId
    ) external view returns (DatasetRecord memory) {
        require(datasets[datasetId].exists, "Dataset not found");
        return datasets[datasetId];
    }

    function getRequest(
        uint256 requestId
    ) external view returns (AccessRecord memory) {
        require(requests[requestId].id != 0, "Request not found");
        return requests[requestId];
    }
}
