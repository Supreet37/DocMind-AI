import { useState } from "react";
import { Youtube, Loader2, Copy, Check, AlertCircle, Wand2, FileText, List, BookOpen, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const BACKEND_URL = "http://127.0.0.1:8000";

// ── helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchTranscript(videoId: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/youtube-transcript?video_id=${videoId}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.text) throw new Error("Empty transcript");
  return data.text;
}

// Chunk transcript to respect token limit (~6000 words max)
function chunkTranscript(text: string, maxWords = 5500): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "\n\n[Transcript truncated for length — summary covers the first portion]";
}

type SummaryMode = "overview" | "bullets" | "study";

const PROMPTS: Record<SummaryMode, string> = {
  overview: `You are an expert content summarizer. Given the following YouTube video transcript, write a clear, flowing summary in 4–6 paragraphs. Cover the main ideas, key arguments, and takeaways. Write in plain English — no bullet points, no headers, just well-structured prose.`,

  bullets: `You are an expert content summarizer. Given the following YouTube video transcript, extract the most important points as a structured list. Format your response exactly like this:

**Key Points:**
• [point 1]
• [point 2]
• [point 3]
(continue for all major points, max 12)

**Main Takeaway:**
[one sentence conclusion]`,

  study: `You are a study assistant. Given the following YouTube video transcript, create a study guide with:

**Topic:** [main subject]

**Core Concepts:**
1. [concept + brief explanation]
2. [concept + brief explanation]
(list all important concepts)

**Key Facts to Remember:**
• [fact]
• [fact]

**Summary:**
[2–3 sentence overview of the whole video]`,
};

async function summarizeWithGroq(text: string, mode: SummaryMode): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY not set in .env file");

  const chunked = chunkTranscript(text);
  const systemPrompt = PROMPTS[mode];

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript:\n\n${chunked}` },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "No summary generated.";
}

// ── types ────────────────────────────────────────────────────────────────────

type InputMode = "url" | "paste";

const SUMMARY_MODES: { id: SummaryMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "bullets",  label: "Key Points", icon: List },
  { id: "study",    label: "Study Guide", icon: Lightbulb },
];

// ── component ────────────────────────────────────────────────────────────────

export default function YouTubeSummarizer() {
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("overview");
  const [urlInput, setUrlInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function handleLoadVideo() {
    const id = extractVideoId(urlInput.trim());
    if (!id) { toast.error("Invalid YouTube URL or video ID"); return; }
    setVideoId(id);
    setTranscript("");
    setSummary("");
    setFetchError(null);
    setFetchingTranscript(true);

    try {
      const t = await fetchTranscript(id);
      setTranscript(t);
      toast.success(`Transcript loaded — ${t.split(/\s+/).length.toLocaleString()} words`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFetchError(`Auto-fetch failed (${msg}). You can paste the transcript manually below.`);
    } finally {
      setFetchingTranscript(false);
    }
  }

  async function handleSummarize() {
    const text = transcript.trim();
    if (!text) { toast.error("No transcript to summarize"); return; }
    setSummarizing(true);
    setSummary("");

    try {
      const result = await summarizeWithGroq(text, summaryMode);
      setSummary(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Groq API failed";
      toast.error(msg);
    } finally {
      setSummarizing(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  // Render summary with basic markdown-like formatting
  function renderSummary(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-foreground mt-4 mb-1 first:mt-0">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return <p key={i} className="text-sm text-foreground leading-relaxed pl-3 before:content-['•'] before:mr-2 before:text-primary">{line.slice(2)}</p>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <p key={i} className="text-sm text-foreground leading-relaxed pl-1">{line}</p>;
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>;
    });
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Top controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Input mode tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {(["url", "paste"] as InputMode[]).map(m => (
            <button
              key={m}
              onClick={() => setInputMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === m ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "url" ? "YouTube URL" : "Paste Transcript"}
            </button>
          ))}
        </div>

        {/* Summary mode tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 ml-auto">
          {SUMMARY_MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSummaryMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${summaryMode === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">

        {/* ── Left: Input ── */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* URL input card */}
          {inputMode === "url" && (
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Youtube size={16} className="text-red-500" />
                YouTube URL
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLoadVideo()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="input-youtube-url"
                />
                <button
                  onClick={handleLoadVideo}
                  disabled={fetchingTranscript || !urlInput.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-2"
                  data-testid="button-load-video"
                >
                  {fetchingTranscript ? <Loader2 size={14} className="animate-spin" /> : <Youtube size={14} />}
                  Load
                </button>
              </div>

              {/* Embedded player */}
              {videoId && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-none"
                    title="YouTube video"
                  />
                </div>
              )}
            </div>
          )}

          {/* Fetch error */}
          {fetchError && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-600 dark:text-yellow-400">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Transcript textarea */}
          <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden min-h-[180px]">
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText size={14} />
                Transcript
              </div>
              <div className="flex items-center gap-3">
                {transcript && (
                  <span className="text-xs text-muted-foreground">{transcript.split(/\s+/).length.toLocaleString()} words</span>
                )}
                {transcript && (
                  <button
                    onClick={() => { setTranscript(""); setSummary(""); setFetchError(null); }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder={
                inputMode === "url"
                  ? "Transcript auto-loads here after clicking Load. You can also paste manually."
                  : "Paste the video transcript or YouTube auto-captions here..."
              }
              className="flex-1 p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
              data-testid="textarea-transcript"
            />
          </div>

          {/* Summarize button */}
          <button
            onClick={handleSummarize}
            disabled={summarizing || !transcript.trim()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            data-testid="button-summarize-youtube"
          >
            {summarizing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {summarizing
              ? "Summarizing with Groq..."
              : `Generate ${SUMMARY_MODES.find(m => m.id === summaryMode)?.label}`}
          </button>
        </div>

        {/* ── Right: Summary output ── */}
        <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden min-h-0">
          <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">AI Summary</span>
              {summary && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  {SUMMARY_MODES.find(m => m.id === summaryMode)?.label}
                </span>
              )}
            </div>
            {summary && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-copy-yt-summary"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {summarizing ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Groq llama3-8b is reading the transcript...</span>
                  </div>
                  {[1, 0.9, 0.75, 0.95, 0.8, 0.6, 0.85, 0.7].map((w, i) => (
                    <Skeleton key={i} className="h-3.5 rounded-full" style={{ width: `${w * 100}%` }} />
                  ))}
                </motion.div>
              ) : summary ? (
                <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  {renderSummary(summary)}
                  <div className="pt-4 mt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Generated by Groq · {GROQ_MODEL} · {summaryMode} mode
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-12 text-center">
                  <Youtube size={36} className="text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Load a video or paste a transcript, then generate a summary</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Powered by Groq · llama3-8b-8192 · Fast &amp; free tier</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}