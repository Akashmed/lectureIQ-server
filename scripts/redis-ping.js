require('dotenv').config();
const IORedis = require('ioredis');

let client;
if (process.env.REDIS_URL) {
  client = new IORedis(process.env.REDIS_URL);
} else {
  client = new IORedis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  });
}

client.ping()
  .then(res => {
    console.log("Redis PING ->", res);
    client.disconnect();
  })
  .catch(err => {
    console.error("Redis connection failed:", err);
    client.disconnect();
  });
