const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { lectureQueue } = require('../jobs/queue');

// POST /lectures
router.post("/lectures", async (req, res) => {
  const { title, source_url, video_id } = req.body;
  const db = getDB();

  const lecture = {
    title,
    source_url,
    video_id,
    status: "pending",
    created_at: new Date()
  };

  const result = await db.collection("lectures").insertOne(lecture);

  // enqueue job
  await lectureQueue.add("processLecture", {
    lectureId: result.insertedId.toString(),
    videoUrl: source_url
  });

  res.status(201).json({ message: "Lecture created", title, source_url, video_id });
});

router.get("/test", (req, res) => {
  res.send("API is working");
});

module.exports = router;
