from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import datetime
import fitz
from youtube_transcript_api import YouTubeTranscriptApi

from embedder import add_document, search, reset_index

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory notes store ────────────────────────────────────────────────────
notes_store: list[dict] = []
note_counter = 1


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    pdfName: str = "Untitled PDF"


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    pdfName: Optional[str] = None


class AskRequest(BaseModel):
    question: str
    top_k: int = 5


# ─── Core routes ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "running"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        reset_index()
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        page_texts = [page.get_text() for page in doc]
        add_document(page_texts)
        return {"status": "Document added successfully", "pages": len(page_texts)}
    except Exception as e:
        return {"error": str(e)}


@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """Extract and return full clean text from PDF without touching the search index."""
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        page_texts = []
        for page in doc:
            text = page.get_text()
            if text.strip():
                page_texts.append(text)
        full_text = "\n\n".join(page_texts)
        return {
            "text": full_text,
            "pages": len(page_texts),
            "chars": len(full_text)
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/search")
def search_docs(query: str):
    try:
        results = search(query)
        return {"query": query, "results": results}
    except Exception as e:
        return {"error": str(e)}


@app.post("/ask")
def ask(req: AskRequest):
    """
    Search the indexed PDF for relevant chunks and return them as a
    formatted answer — no external AI API needed.
    """
    try:
        results = search(req.question, top_k=req.top_k)
        if not results:
            return {
                "answer": "No document has been uploaded yet, or no relevant content was found. Please upload a PDF first.",
                "sources": []
            }

        # Build a readable answer from the top chunks
        answer_parts = []
        for i, r in enumerate(results[:3], 1):
            answer_parts.append(f"[Page {r['page']}]: {r['text'].strip()}")

        answer = "\n\n".join(answer_parts)

        return {
            "answer": answer,
            "sources": [{"page": r["page"], "text": r["text"][:200]} for r in results]
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Notes CRUD ───────────────────────────────────────────────────────────────
@app.get("/notes")
def list_notes():
    return notes_store


@app.post("/notes")
def create_note(note: NoteCreate):
    global note_counter
    new_note = {
        "id": note_counter,
        "title": note.title,
        "content": note.content,
        "pdfName": note.pdfName,
        "createdAt": datetime.datetime.now().isoformat(),
        "updatedAt": datetime.datetime.now().isoformat(),
    }
    notes_store.append(new_note)
    note_counter += 1
    return new_note


@app.put("/notes/{note_id}")
def update_note(note_id: int, data: NoteUpdate):
    for note in notes_store:
        if note["id"] == note_id:
            if data.title is not None:
                note["title"] = data.title
            if data.content is not None:
                note["content"] = data.content
            if data.pdfName is not None:
                note["pdfName"] = data.pdfName
            note["updatedAt"] = datetime.datetime.now().isoformat()
            return note
    return {"error": "Note not found"}


@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    global notes_store
    notes_store = [n for n in notes_store if n["id"] != note_id]
    return {"ok": True}

@app.get("/youtube-transcript")
def get_transcript(video_id: str):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([t["text"] for t in transcript])
        return {"text": text, "segments": len(transcript)}
    except Exception as e:
        return {"error": str(e)}