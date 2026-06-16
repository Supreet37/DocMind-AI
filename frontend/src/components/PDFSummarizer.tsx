import { useState, useRef } from "react";
import { Upload, FileText, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const BACKEND_URL = "http://127.0.0.1:8000";

type SummaryLength = "short" | "medium" | "detailed";
const lengthCounts: Record<SummaryLength, number> = { short: 4, medium: 9, detailed: 16 };
const lengthLabels: Record<SummaryLength, string> = {
  short: "Short (~2 paragraphs)",
  medium: "Medium (~5 paragraphs)",
  detailed: "Detailed (comprehensive)",
};

function extractiveSummarize(text: string, length: SummaryLength): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const n = lengthCounts[length];
  const step = Math.max(1, Math.floor(sentences.length / n));
  const selected: string[] = [];
  for (let i = 0; i < sentences.length && selected.length < n; i += step) {
    const s = sentences[i].trim();
    if (s.length > 30) selected.push(s);
  }
  return selected.join(" ");
}

async function extractTextViaBackend(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BACKEND_URL}/extract`, { method: "POST", body: formData });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text as string;
}

export default function PDFSummarizer() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setSummary("");
    setExtracting(true);
    try {
      const extracted = await extractTextViaBackend(f);
      setText(extracted);
      toast.success(`${f.name} loaded — ${extracted.length} characters extracted`);
    } catch (err) {
      toast.error("Failed to extract text. Is the backend running?");
      setText("");
    } finally {
      setExtracting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") handleFile(f);
  }

  async function handleSummarize() {
    if (!text.trim()) { toast.error("Please upload a PDF first"); return; }
    setLoading(true);
    setSummary("");
    try {
      // Try HuggingFace first
      const chunk = text.slice(0, 1000);
      const res = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: chunk,
            parameters: { min_length: 60, max_length: 200, do_sample: false },
          }),
        }
      );
      if (!res.ok) throw new Error("HF unavailable");
      const data = await res.json();
      const result = Array.isArray(data) ? data[0]?.summary_text : data.summary_text;
      if (!result) throw new Error("Empty");
      setSummary(result);
    } catch {
      // Fallback: extractive summarization using real extracted text
      const result = extractiveSummarize(text, length);
      setSummary(result || "Could not generate summary — document may have no extractable text.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/20"
        onClick={() => inputRef.current?.click()}
        data-testid="pdf-summarizer-dropzone"
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          data-testid="input-summarizer-pdf" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            {extracting ? <Loader2 size={22} className="text-primary animate-spin" /> : <Upload size={22} className="text-primary" />}
          </div>
          {file ? (
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              <span className="text-sm font-medium text-foreground">{file.name}</span>
              {extracting && <span className="text-xs text-muted-foreground">Extracting text...</span>}
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">Drop a PDF here or click to browse</p>
              <p className="text-xs text-muted-foreground">Text is extracted via your local backend</p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(lengthLabels) as SummaryLength[]).map(key => (
            <button key={key} onClick={() => setLength(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                length === key
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
              }`} data-testid={`button-length-${key}`}>
              {lengthLabels[key]}
            </button>
          ))}
        </div>
        <button onClick={handleSummarize} disabled={loading || !file || extracting}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          data-testid="button-generate-summary">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          Generate Summary
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
          <span className="text-sm font-medium text-foreground">Summary</span>
          {summary && (
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-copy-summary">
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {[1, 0.9, 0.75, 0.85, 0.6].map((w, i) => (
                  <Skeleton key={i} className="h-4 rounded-full" style={{ width: `${w * 100}%` }} />
                ))}
              </motion.div>
            ) : summary ? (
              <motion.p key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {summary}
              </motion.p>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12">
                <Wand2 size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Upload a PDF and click Generate Summary</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Extracts real text via your FastAPI backend</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}