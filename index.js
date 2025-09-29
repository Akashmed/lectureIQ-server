const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { connectDB, client } = require('./config/db');
const routes = require('./APIs/routes');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
    res.send('lectureIQ is running');
})


connectDB().then(() => {
  app.use('/api', routes);

  app.listen(port, () => {
    console.log(`lectureIQ listening on port ${port}`);
  });
});

// Optional: Close client on app termination
process.on('SIGINT', async () => {
  await client.close();
  console.log("MongoDB connection closed.");
  process.exit();
});