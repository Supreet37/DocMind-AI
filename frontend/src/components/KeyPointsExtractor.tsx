import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Download, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const BACKEND_URL = "http://127.0.0.1:8000";

const STOPWORDS = new Set(["the","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","shall","can","a","an","and","or","but","in","on","at","to","for","of","with","by","from","this","that","these","those","it","its","not","no","so","yet","each","few","more","most","other","some","such","than","too","very","just","only","also","about","into","over","after","under","between","through","during","before","then","now","well","back","even","still","any","all","once","two","three","four","five","six","seven","eight","nine","ten","fig","also","thus","hence","since","though","while","where","which","who","whom","whose","what","when","how","why","both","either","neither","one","new","used","using","use","based","show","shows","shown","result","results","different","however","therefore","within","without","across","among","around","per","via","vs","etc","al","ie","eg"]);

function tfidfExtract(text: string, topN = 24): string[] {
  const words = text.toLowerCase().match(/\b[a-z][a-z]{2,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!STOPWORDS.has(w) && !/^\d+$/.test(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

async function extractTextViaBackend(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BACKEND_URL}/extract`, { method: "POST", body: formData });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text as string;
}

interface KeyPoint {
  text: string;
  score?: number;
  source: "ai" | "local";
}

const COLORS = [
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20",
  "bg-blue-500/15 text-blue-400 border-blue-500/20",
];

export default function KeyPointsExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [points, setPoints] = useState<KeyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setPoints([]);
    setExtracting(true);
    try {
      const extracted = await extractTextViaBackend(f);
      setText(extracted);
      toast.success(`${f.name} loaded`);
    } catch {
      toast.error("Failed to extract text. Is the backend running?");
    } finally {
      setExtracting(false);
    }
  }

  async function handleExtract() {
    if (!text.trim()) { toast.error("Upload a PDF first"); return; }
    setLoading(true);
    setPoints([]);
    try {
      // Try HuggingFace
      const res = await fetch(
        "https://api-inference.huggingface.co/models/ml6team/keyphrase-extraction-kbir-inspec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: text.slice(0, 512) }),
        }
      );
      if (!res.ok) throw new Error("HF unavailable");
      const data = await res.json();
      const entities: { word: string; score: number }[] = Array.isArray(data) ? data : [];
      if (entities.length === 0) throw new Error("Empty");
      setPoints(entities.slice(0, 24).map(e => ({ text: e.word, score: e.score, source: "ai" })));
    } catch {
      // Fallback: TF-IDF on real extracted text
      const keywords = tfidfExtract(text, 24);
      setPoints(keywords.map(k => ({ text: k, source: "local" })));
      toast.info("Using TF-IDF extraction (HF API unavailable)");
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const content = points.map((p, i) => `${i + 1}. ${p.text}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "key-points.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div
        className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/20"
        onClick={() => inputRef.current?.click()}
        data-testid="key-points-dropzone"
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          data-testid="input-keypoints-pdf" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            {extracting ? <Loader2 size={22} className="text-primary animate-spin" /> : <Upload size={22} className="text-primary" />}
          </div>
          {file ? (
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              {extracting && <span className="text-xs text-muted-foreground">Extracting...</span>}
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
              <p className="text-xs text-muted-foreground">Text extracted via local backend</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleExtract} disabled={loading || !file || extracting}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          data-testid="button-extract-keypoints">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Extract Key Points
        </button>
        {points.length > 0 && (
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm border border-border hover:bg-muted transition-all"
            data-testid="button-export-keypoints">
            <Download size={14} /> Export
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-sm font-medium">Key Points</span>
          {points.length > 0 && <span className="text-xs text-muted-foreground">{points.length} extracted</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${60 + Math.random() * 80}px` }} />
                ))}
              </motion.div>
            ) : points.length > 0 ? (
              <motion.div key="results" className="flex flex-wrap gap-2">
                {points.map((p, i) => (
                  <motion.span key={i}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${COLORS[i % COLORS.length]}`}
                    data-testid={`key-point-${i}`}>
                    {p.text}
                  </motion.span>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" className="h-full flex flex-col items-center justify-center py-12 text-center">
                <Zap size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Upload a PDF and extract key points</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}