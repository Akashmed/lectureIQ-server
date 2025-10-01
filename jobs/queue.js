const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// Create Redis connection with ioredis
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

// Create the queue
const lectureQueue = new Queue("lectureQueue", {
  connection
});

connection.on("connect", () => {
  console.log("Connected to Redis server");
});
connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = { lectureQueue, connection };
