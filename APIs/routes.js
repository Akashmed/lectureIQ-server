const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// GET all items
router.get('/items', async (req, res) => {
  try {
    const db = getDB();
    const items = await db.collection('items').find().toArray();
    res.json("items");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new item
router.post('/items', async (req, res) => {
  try {
    const db = getDB();
    const newItem = req.body;
    const result = await db.collection('items').insertOne(newItem);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// will add more routes here...

module.exports = router;
