# Blockchain (Hardhat)

Local Ethereum network used by the marketplace backend.

## Commands

```bash
npm install
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Keep `npx hardhat node` running in its own terminal. Restarting the node wipes chain state, so you must deploy again and re-seed the backend.
