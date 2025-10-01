const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// Connect to MongoDB once when this module is imported
async function connectDB() {
  try {
    await client.connect();
    db = client.db("lectureIQdb");
    console.log("Connected to MongoDB!");
    return db;
  } catch (err) {
    console.error(err);
  }
}

function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB first.");
  return db;
}

module.exports = { connectDB, getDB, client };
