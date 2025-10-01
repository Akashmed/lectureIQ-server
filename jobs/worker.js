// jobs/worker.js
const { Worker } = require("bullmq");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");
const { connection } = require("./queue");
const { connectDB, getDB } = require("../config/db");

const QUEUE_NAME = "lectureQueue";


// Utility: run ffmpeg to chunk audio
function extractChunks(videoUrl, outputDir, chunkDuration = 60) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg(videoUrl)
            .noVideo()
            .audioCodec("pcm_s16le") // raw audio
            .audioChannels(1)
            .audioFrequency(16000)
            .format("wav")
            .outputOptions([
                "-f segment",
                `-segment_time ${chunkDuration}`,
                "-reset_timestamps 1",
            ])
            .save(path.join(outputDir, "chunk-%03d.wav"))
            .on("end", () => resolve())
            .on("error", (err) => reject(err));
    });
}

// Utility: run Python transcriber
function runTranscriber(chunkDir, lectureId) {
    return new Promise((resolve, reject) => {
        const pyPath = path.join(__dirname, "../processors/transcriber.py");

        const py = spawn("python", [pyPath, chunkDir, lectureId]);

        let output = "";
        let errorOutput = "";

        py.stdout.on("data", (data) => {
            output += data.toString();
        });

        py.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        py.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Python exited with code ${code}: ${errorOutput}`));
            } else {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (err) {
                    reject(new Error("Failed to parse Python output: " + output));
                }
            }
        });
    });
}

// BullMQ Worker
const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { videoUrl, lectureId } = job.data;

        console.log(`🎬 Processing lecture ${lectureId} from ${videoUrl}`);

        // Temporary output directory
        const outputDir = path.join(__dirname, `../tmp/${lectureId}-${uuidv4()}`);

        try {
            // Step 1: Extract audio chunks
            await extractChunks(videoUrl, outputDir, 60); // 60 sec chunks

            // Step 2: Run Python transcriber
            const transcriptResult = await runTranscriber(outputDir, lectureId);
            await connectDB();
            const db = getDB();

            await db.collection("lectures").updateOne(
                { _id: new ObjectId(lectureId) },
                { $set: { status: "ready" } }
            );

            console.log("✅ Transcript complete");
            return transcriptResult;
        } catch (err) {
            console.error("❌ Worker error:", err);
            throw err;
        } finally {
            // Cleanup tmp dir
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
    },
    {
        connection,
    }
);

worker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed!`);
    console.log(result); // transcript JSON
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
});
