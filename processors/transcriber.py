import sys, os, json
from faster_whisper import WhisperModel

chunk_dir = sys.argv[1]
lecture_id = sys.argv[2]

model = WhisperModel("medium", device="cpu")

full_text = []

for file in sorted(os.listdir(chunk_dir)):
    if not file.endswith(".wav"):
        continue
    segments, _ = model.transcribe(os.path.join(chunk_dir, file))
    chunk_text = " ".join([seg.text for seg in segments])
    full_text.append(chunk_text)

print(json.dumps({"lecture_id": lecture_id, "transcript": " ".join(full_text)}))
