# 🚀 DocMind AI

<div align="center">

### Transform PDFs into Knowledge with AI

*Upload • Search • Summarize • Chat • Learn*

![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge\&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?style=for-the-badge\&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge\&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge\&logo=python)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)

</div>

---

## 📖 Overview

**DocMind AI** is an intelligent document-learning platform that allows users to upload PDFs and interact with them using advanced AI models.

Whether you're a student, researcher, or professional, DocMind AI helps you:

* 🔍 Search information instantly
* 📝 Generate notes automatically
* 📚 Create study materials
* 🤖 Chat with documents
* 🎧 Convert knowledge into audio

---

# ✨ Features

## 🔎 Semantic PDF Search

Search across PDF documents using vector embeddings and semantic retrieval.

### Highlights

* AI-powered document understanding
* Context-aware search results
* Fast retrieval with FAISS
* Highlighted matches

---

## 📄 PDF Summarizer

Generate concise summaries from lengthy documents.

### Supports

* Extractive Summarization
* Abstractive Summarization
* AI-generated insights

---

## 🧠 DocMind GPT

Chat directly with your PDFs using Retrieval-Augmented Generation (RAG).

### Capabilities

* Ask questions
* Get contextual answers
* Multi-document understanding
* Conversation history

---

## 📝 Notes Generator

Turn PDFs into organized notes automatically.

### Features

* Smart note creation
* Editable notes
* Export support
* AI assistance

---

## 🔑 Key Points Extraction

Extract important concepts instantly.

### Outputs

* Key phrases
* Important topics
* Study points
* Revision notes

---

## 🎧 Voice Summarizer

Convert generated summaries into speech.

### Benefits

* Audio learning
* Faster revision
* Hands-free studying

---

## 🎥 YouTube Summarizer

Summarize educational YouTube videos using AI.

### Powered By

* Groq API
* LLaMA 3.3 70B

---

## 🖼️ AI Image Notes

Generate notes from PDF images and pages.

### Features

* OCR extraction
* AI summarization
* Flashcard generation
* Key-point extraction

---

# 🛠 Tech Stack

## Frontend

| Technology     | Usage           |
| -------------- | --------------- |
| React 18       | UI Development  |
| TypeScript     | Type Safety     |
| Vite           | Build Tool      |
| Tailwind CSS   | Styling         |
| Framer Motion  | Animations      |
| TanStack Query | Data Management |
| Lucide React   | Icons           |

---

## Backend

| Technology            | Usage          |
| --------------------- | -------------- |
| FastAPI               | API Framework  |
| Python                | Core Language  |
| FAISS                 | Vector Search  |
| PyPDF2                | PDF Processing |
| Sentence Transformers | Embeddings     |
| Uvicorn               | Server         |

---

## AI Models

| Model             | Purpose             |
| ----------------- | ------------------- |
| LLaMA 3.3 70B     | Q&A & Summaries     |
| BART              | Text Summarization  |
| BLIP              | Image Understanding |
| OpenAI Embeddings | Semantic Search     |

---

# 🏗 Architecture

```text
                ┌──────────────────┐
                │     User UI      │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ React Frontend   │
                └────────┬─────────┘
                         │ API Calls
                         ▼
                ┌──────────────────┐
                │ FastAPI Backend  │
                └────────┬─────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼

   PDF Parsing     Vector Search     AI Models
    (PyPDF2)         (FAISS)      (LLaMA/BART)
```

---

# 📂 Project Structure

```bash
DocMind-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── embedder.py
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

---

# ⚡ Quick Start

## Clone Repository

```bash
git clone https://github.com/yourusername/docmind-ai.git
cd docmind-ai
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Backend Setup

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / Mac

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run server:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs on:

```text
http://localhost:8000
```

---

# 🔐 Environment Variables

Create a `.env` file:

```env
VITE_GROQ_API_KEY=your_groq_api_key
```

---

# 📸 Screenshots

Add screenshots here:

```text
docs/
├── home.png
├── search.png
├── gpt-chat.png
├── summarizer.png
└── notes.png
```

---

# 🚀 Future Improvements

* User Authentication
* Cloud PDF Storage
* Team Collaboration
* Quiz Generation
* AI Mind Maps
* Multi-language Support

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push changes

```bash
git push origin feature/new-feature
```

5. Open Pull Request

---

# ⭐ Support

If you found this project useful:

⭐ Star the repository

🍴 Fork the project

📢 Share it with others

---

<div align="center">

### Made with ❤️ using React, FastAPI and AI

**DocMind AI — Learn Smarter, Not Harder**

</div>
