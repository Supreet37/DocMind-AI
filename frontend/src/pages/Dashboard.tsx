import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar, { type DashboardView } from "@/components/Sidebar";
import Header from "@/components/Header";
import Search from "@/components/Search";
import PDFSearchPage from "@/components/PDFSearchPage";
import PDFSummarizer from "@/components/PDFSummarizer";
import KeyPointsExtractor from "@/components/KeyPointsExtractor";
import NotesMaker from "@/components/NotesMaker";
import MemoryVoiceSummarizer from "@/components/MemoryVoiceSummarizer";
import GPT from "@/components/GPT";
import YouTubeSummarizer from "@/components/YouTubeSummarizer";
import AIImageNotesMaker from "@/components/AIImageNotesMaker";
import Settings from "@/components/Settings";
import { toast } from "sonner";

const BACKEND_URL = "http://127.0.0.1:8000";

const viewTitles: Record<DashboardView, string> = {
  "home":        "Semantic Search",
  "pdf-search":  "PDF Search",
  "summarizer":  "PDF Summarizer",
  "key-points":  "Key Points Extractor",
  "notes":       "Notes Maker",
  "voice":       "Memory Voice Summarizer",
  "gpt":         "DocMind GPT",
  "youtube":     "YouTube Summarizer",
  "image-notes": "AI Image Notes Maker",
  "settings":    "Settings",
};

function HomeView() {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploaded(true);
      setFileName(file.name);
      toast.success(`${file.name} uploaded — ${data.pages} pages indexed`);
    } catch {
      toast.error("Upload failed. Is the backend running on port 8000?");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
      {/* Upload card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-1">Upload PDF</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a PDF to index it, then search semantically below.
        </p>
        <label className="cursor-pointer block">
          <input type="file" accept=".pdf" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            data-testid="input-home-upload" />
          <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors hover:border-primary/50 ${
            uploaded ? "border-green-500/40 bg-green-500/5" : "border-border bg-secondary/20"
          }`}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {uploading
                  ? <Loader2 size={18} className="text-primary animate-spin" />
                  : uploaded
                  ? <FileText size={18} className="text-green-500" />
                  : <Upload size={18} className="text-primary" />}
              </div>
              <p className="text-sm font-medium">
                {uploading ? "Uploading & indexing..." : uploaded ? `${fileName} — ready` : "Click to upload a PDF"}
              </p>
              {uploaded && <p className="text-xs text-green-500">Indexed successfully</p>}
            </div>
          </div>
        </label>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4">
        {!uploaded ? (
          <p className="text-sm text-muted-foreground text-center py-4">Upload a PDF above to start searching</p>
        ) : (
          <Search />
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeView, setActiveView] = useState<DashboardView>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={viewTitles[activeView]} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6" data-testid="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {activeView === "home"        && <HomeView />}
              {activeView === "pdf-search"  && <PDFSearchPage />}
              {activeView === "summarizer"  && <PDFSummarizer />}
              {activeView === "key-points"  && <KeyPointsExtractor />}
              {activeView === "notes"       && <NotesMaker />}
              {activeView === "voice"       && <MemoryVoiceSummarizer />}
              {activeView === "gpt"         && <GPT />}
              {activeView === "youtube"     && <YouTubeSummarizer />}
              {activeView === "image-notes" && <AIImageNotesMaker />}
              {activeView === "settings"    && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}