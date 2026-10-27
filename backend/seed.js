const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectDb } = require("./utils/db");
const { seedData } = require("./utils/seedData");

dotenv.config();

async function run() {
  await connectDb();
  await seedData({ reset: true });
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
