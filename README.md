# Blockchain-Based Medical Research Data Marketplace

College project that lets hospitals and laboratories publish **synthetic** medical research datasets, researchers request access, providers grant consent, and a **simulated payment** unlocks download. File bytes stay off-chain (AES-256). Dataset hashes, consent, and payment flags are written to a **local Hardhat Ethereum** network.

> Use sample/synthetic data only. Do not upload real patient records.

## Folder structure

```text
├── blockchain/          Hardhat + Solidity contract
├── backend/             Node.js, Express, MongoDB, AES-256, ethers.js
├── frontend/            React + Vite + Bootstrap
├── .env.example         Shared environment template
└── README.md
```

## What is real vs simulated

| Feature | Where it runs |
|---|---|
| User login / roles | MongoDB + JWT (off-chain) |
| Encrypted file storage | Disk + AES-256-CBC (off-chain) |
| Dataset SHA-256 hash | Stored in MongoDB **and** on the smart contract |
| Access request + consent approve/reject | MongoDB **and** smart contract |
| Payment | **Simulated.** No INR/ETH is transferred. The contract only stores `paymentRecorded = true` |
| Integrity check | Compares your hash/file with MongoDB and `verifyHash()` on-chain |

The backend uses **Hardhat Account #0** as the application signer. Students do not need MetaMask for the demo.

## Prerequisites

- Node.js 18+
- MongoDB Community running locally (`mongodb://127.0.0.1:27017`)
- Git (optional)

## 1. Install dependencies

From the project root (PowerShell):

```powershell
cd blockchain; npm install; cd ..
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

## 2. Environment files

Backend env is already filled for local demo in `backend/.env`. To recreate it:

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

`AES_SECRET_KEY` must be 64 hex characters (32 bytes) for AES-256.

## 3. MongoDB

If the MongoDB Windows service is running, the API uses `mongodb://127.0.0.1:27017`.

If MongoDB is not running, the API **automatically starts an in-memory MongoDB** (data lasts until you stop the backend). Demo users are seeded on first start. This is enough for a classroom demo. For a persistent database, start MongoDB and then run `npm run seed` in `backend`.

## Optional: run smart contract tests

```powershell
cd blockchain
npx hardhat test
```

## 4. Start the local blockchain

**Terminal A** (keep this open):

```powershell
cd blockchain
npx hardhat node
```

This prints 20 demo accounts. Account #0 private key is already in `backend/.env`.

## 5. Deploy the smart contract

**Terminal B:**

```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

The script writes `blockchain/contract-address.json` and `backend/contract-address.json`. Copy the printed address into `backend/.env` as `CONTRACT_ADDRESS` (optional, because the backend also reads the JSON file).

If you restart `hardhat node`, the chain is empty again. Deploy again, then re-run the seed.

## 6. Seed sample users and datasets

**Terminal B:**

```powershell
cd backend
npm run seed
```

Demo password for all seeded users: `Password@123`

| Role | Email |
|---|---|
| Admin | admin@marketplace.com |
| Hospital | hospital@citycare.com |
| Laboratory | lab@genelab.com |
| Researcher | researcher@uni.edu |

## 7. Start the API and UI

**Terminal C:**

```powershell
cd backend
npm run dev
```

**Terminal D:**

```powershell
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

API health: [http://localhost:5000/api/system/health](http://localhost:5000/api/system/health)

## Suggested demo flow (viva)

1. Login as **hospital** → see seeded datasets → approve the pending researcher request.
2. Login as **researcher** → Browse datasets → Simulate payment → Download the CSV.
3. Open **Verify hash** → paste the dataset SHA-256 from the details page → confirm blockchain match.
4. Login as **admin** → users, datasets, requests, transaction hashes.
5. Login as **laboratory** → upload `backend/sample-data/synthetic_lab_biomarkers.json`.

## Connecting React to the contract

React never talks to Ethereum directly. Flow:

1. Hardhat node at `http://127.0.0.1:8545`
2. Contract address in `backend/contract-address.json`
3. Express (`backend/utils/blockchain.js`) calls contract methods with `ethers`
4. React calls Express REST APIs (`frontend/src/api.js`)

To point at another local deployment, change `CONTRACT_ADDRESS` and restart the backend.

## Default local keys (Hardhat, public, demo-only)

- RPC: `http://127.0.0.1:8545`
- Account #0 private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

Never use these keys on a public network.

## Troubleshooting

- **Mongo connection failed** — start MongoDB first.
- **Blockchain offline in admin dashboard** — Terminal A (`hardhat node`) is not running, or you have not deployed.
- **Nonce / contract errors after restarting Hardhat** — deploy again and run `npm run seed`.
- **CORS / API errors** — backend must be on port 5000, frontend on 5173.
