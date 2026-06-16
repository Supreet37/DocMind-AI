# DocMind AI 📚

An intelligent, AI-powered PDF knowledge platform that transforms how you interact with documents. Upload PDFs, extract insights, generate summaries, create flashcards, and chat with your documents - all powered by cutting-edge AI.

## 🚀 Features

### Core Tools
- **Semantic Search** - AI-powered search across PDF documents with intelligent retrieval
- **PDF Summarizer** - Generate concise summaries from PDF content using extractive & abstractive methods
- **Key Points Extractor** - Automatically extract key phrases and important concepts
- **Notes Maker** - Create, edit, and manage notes with AI assistance
- **Voice Summarizer** - Convert text to speech for audio learning and memorization

### AI Features
- **DocMind GPT** - Chat with your documents using RAG (Retrieval-Augmented Generation)
- **YouTube Summarizer** - Summarize any YouTube video using Groq's LLaMA 3.3 70B
- **AI Image Notes** - Extract text from PDF pages and generate summaries, flashcards, or key points

### User Experience
- **Dark/Light Mode** - Seamless theme switching
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Live progress tracking and animations
- **Export Capabilities** - Download notes, summaries, and key points as text files

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool & Dev Server |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| TanStack Query | Data Fetching & Caching |
| Sonner | Toast Notifications |
| Next Themes | Theme Management |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | REST API Framework |
| Python 3.9+ | Programming Language |
| PyPDF2 | PDF Text Extraction |
| Sentence Transformers | Semantic Embeddings |
| FAISS | Vector Search |
| Uvicorn | ASGI Server |

### AI/ML
| Model | Purpose |
|-------|---------|
| Groq LLaMA 3.3 70B | Text generation, summarization, Q&A |
| Facebook BART | Abstractive summarization |
| ML6 Keyphrase Extraction | Key point extraction |
| Salesforce BLIP | Image captioning |
| OpenAI Text Embeddings | Semantic search |

## 📁 Project Structure
```
Semantic-search/
│
├── frontend/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/               # All React Components
│   │   │   ├── AIImageNotesMaker.tsx   # PDF to notes with AI
│   │   │   ├── GPT.tsx                 # DocMind GPT chat
│   │   │   ├── Header.tsx              # App header with user controls
│   │   │   ├── KeyPointsExtractor.tsx  # Extract key phrases from PDF
│   │   │   ├── LoginModal.tsx          # Authentication modal
│   │   │   ├── MemoryVoiceSummarizer.tsx # Text-to-speech tool
│   │   │   ├── NotesMaker.tsx          # Notes CRUD operations
│   │   │   ├── PDFSearchPage.tsx       # PDF upload + semantic search
│   │   │   ├── PDFSummarizer.tsx       # PDF summarization tool
│   │   │   ├── Search.tsx              # Search component with highlighting
│   │   │   ├── Settings.tsx            # App settings & preferences
│   │   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   │   ├── ThemeProvider.tsx       # Theme management
│   │   │   └── YouTubeSummarizer.tsx   # YouTube video summarizer
│   │   ├── contexts/                  # React Context Providers
│   │   │   ├── AuthContext.tsx          # Authentication state
│   │   │   └── SettingsContext.tsx      # App settings state
│   │   ├── hooks/                     # Custom React Hooks
│   │   ├── lib/                       # Utility Functions
│   │   ├── pages/                     # Page Components
│   │   ├── App.tsx                    # Main App Component
│   │   ├── index.css                  # Global Styles
│   │   └── main.tsx                   # Entry Point
│   ├── public/                        # Static Assets
│   ├── .env                           # Environment Variables
│   ├── .gitignore                     # Git Ignore Rules
│   ├── index.html                     # HTML Template
│   ├── package.json                   # Dependencies
│   ├── tsconfig.json                  # TypeScript Config
│   └── vite.config.js                 # Vite Configuration
│
├── backend/                           # FastAPI Backend
│   ├── models/                       # ML Models & Vector Stores
│   ├── __pycache__/                  # Python Cache
│   ├── venv/                         # Python Virtual Environment
│   ├── embedder.py                   # Text Embedding Service
│   ├── main.py                       # FastAPI Application
│   └── requirements.txt              # Python Dependencies
│
└── README.md                         # Project Documentation
```

# Clone the repository
git clone https://github.com/yourusername/docmind-ai.git
cd docmind-ai

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Groq API key to .env
# VITE_GROQ_API_KEY=your_groq_api_key_here

# Start development server
npm run dev

# Open a new terminal
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000

🤝 Contributing
Fork the repository

Create a feature branch: git checkout -b feature/amazing-feature

Commit changes: git commit -m 'Add amazing feature'

Push to branch: git push origin feature/amazing-feature

Open a Pull Request

Development Guidelines
Follow TypeScript best practices

Use functional components with hooks

Write meaningful commit messages

Test before submitting PR

Update documentation as needed
