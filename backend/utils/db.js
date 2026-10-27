const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer = null;

async function connectDb() {
  const uri =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/medical_research_marketplace";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log("Connected to MongoDB at", uri);
    return { inMemory: false };
  } catch (error) {
    console.warn(
      "MongoDB is not running on 27017. Starting an in-memory database for this demo."
    );
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    console.log("Connected to in-memory MongoDB (data lasts until the API stops).");
    return { inMemory: true };
  }
}

module.exports = { connectDb };
