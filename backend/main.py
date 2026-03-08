"""
Thai word segmentation API using PyThaiNLP.

Endpoints:
  POST /segment  — segment Thai text into words with spaces
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pythainlp.tokenize import word_tokenize

app = FastAPI(title="Thai Word Segmenter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class SegmentRequest(BaseModel):
    text: str
    engine: str = "newmm"  # newmm (default), attacut, longest


class SegmentResponse(BaseModel):
    segmented: str


@app.post("/segment", response_model=SegmentResponse)
def segment_text(req: SegmentRequest):
    """Segment Thai text and join with spaces."""
    lines = req.text.split("\n")
    result_lines = []

    for line in lines:
        if not line.strip():
            result_lines.append(line)
            continue

        words = word_tokenize(line, engine=req.engine)
        # Join words with spaces, but don't double-space
        segmented = ""
        for word in words:
            if not segmented:
                segmented = word
                continue
            # Don't add space before/after existing whitespace
            if segmented.endswith(" ") or word.startswith(" ") or word == " ":
                segmented += word
            else:
                segmented += " " + word
        result_lines.append(segmented)

    return SegmentResponse(segmented="\n".join(result_lines))


@app.get("/health")
def health():
    return {"status": "ok"}
