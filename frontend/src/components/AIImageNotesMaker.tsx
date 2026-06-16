import { useState, useRef } from "react";
import { 
  Upload, Image as ImageIcon, Loader2, Download, Trash2, 
  Sparkles, ChevronDown, ChevronUp, Copy, Check, Layers, 
  FileText, Lightbulb, List, Scan, Type 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface PageNote {
  id: string;
  pageNum: number;
  imageDataUrl: string;
  extractedText: string;
  isScanned: boolean;
  summary: string;
  flashcards: string;
  keyPoints: string;
  userNote: string;
  loading: boolean;
  ocrProgress: number;
}

type OutputMode = "summary" | "flashcards" | "keypoints";

// --- PDF Text Extraction ---
async function extractTextFromPDF(
  file: File, 
  onProgress?: (message: string) => void
): Promise<{ pageNum: number; text: string; imageDataUrl: string; isScanned: boolean }[]> {
  
  try {
    onProgress?.("Loading PDF.js...");
    
    // @ts-ignore - loaded as an ES module from a CDN at runtime, no local types
    const pdfjsLib = await import(/* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs");
    
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, 12);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const results: { pageNum: number; text: string; imageDataUrl: string; isScanned: boolean }[] = [];

    for (let i = 1; i <= numPages; i++) {
      onProgress?.(`Processing page ${i}/${numPages}...`);
      
      const page = await pdf.getPage(i);
      
      // Extract text - using @ts-ignore for TypeScript
      const textContent = await page.getTextContent();
      // @ts-ignore - PDF.js type definitions are incomplete
      const pageText = textContent.items.map((item: { str: string }) => item.str).join(" ").trim();
      
      // Render page as image (for display)
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // Check if the page has text (more than a few words)
      const wordCount = pageText.split(/\s+/).length;
      const hasText = wordCount > 15;
      
      results.push({
        pageNum: i,
        text: hasText ? pageText : `[Page ${i} - This appears to be a scanned image. Please use a text-based PDF.]`,
        imageDataUrl,
        isScanned: !hasText,
      });
    }

    return results;
  } catch (error) {
    console.error('PDF Error:', error);
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// --- Groq API calls ---
async function analyzeWithGroq(text: string, mode: OutputMode): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY not set");

  const prompts = {
    summary: `You are an expert summarizer. Given the following text from a PDF page, write a clear, concise summary in 2-3 sentences. Focus on the main idea and key points.\n\nText: "${text}"`,
    flashcards: `You are a study assistant. Given the following text from a PDF page, create 3-5 flashcards. Format each as:
Q: [question]
A: [answer]
Separate each flashcard with a blank line.\n\nText: "${text}"`,
    keypoints: `You are a content analyst. Given the following text from a PDF page, extract the 5 most important key points. Format as bullet points with •.\n\nText: "${text}"`,
  };

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes PDF content." },
        { role: "user", content: prompts[mode] },
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
  return data.choices?.[0]?.message?.content?.trim() || "No analysis generated.";
}

// --- Component ---
export default function AIImageNotesMaker() {
  const [pages, setPages] = useState<PageNote[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<OutputMode>("summary");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  async function processFile(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    setLoadingPdf(true);
    setPages([]);
    setProcessingStatus("Loading PDF...");
    toast.info("Processing PDF...");

    try {
      const extractedPages = await extractTextFromPDF(
        file,
        (message) => {
          setProcessingStatus(message);
        }
      );
      
      const newPages: PageNote[] = extractedPages.map((p, idx) => ({
        id: `page-${idx}-${Date.now()}`,
        pageNum: p.pageNum,
        imageDataUrl: p.imageDataUrl,
        extractedText: p.text,
        isScanned: p.isScanned,
        summary: "",
        flashcards: "",
        keyPoints: "",
        userNote: "",
        loading: false,
        ocrProgress: 0,
      }));

      setPages(newPages);
      
      const scannedCount = newPages.filter(p => p.isScanned).length;
      const textCount = newPages.filter(p => !p.isScanned).length;
      
      if (scannedCount === newPages.length) {
        toast.warning(`All ${newPages.length} pages appear to be scanned images. OCR is not enabled.`);
      } else {
        toast.success(
          `${newPages.length} pages processed — ${textCount} text-based, ${scannedCount} scanned`
        );
      }
      setProcessingStatus("");
    } catch (err) {
      console.error(err);
      toast.error(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setProcessingStatus("");
    } finally {
      setLoadingPdf(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (loadingPdf) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function analyzePage(id: string, text: string) {
    if (!text || text.startsWith("[Page")) {
      toast.error("No text found on this page to analyze");
      return;
    }

    setPages(prev => prev.map(p => p.id === id ? { ...p, loading: true } : p));

    try {
      const result = await analyzeWithGroq(text, outputMode);
      
      setPages(prev => prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          loading: false,
          summary: outputMode === "summary" ? result : p.summary,
          flashcards: outputMode === "flashcards" ? result : p.flashcards,
          keyPoints: outputMode === "keypoints" ? result : p.keyPoints,
        };
      }));
      
      toast.success(`Page ${pages.find(p => p.id === id)?.pageNum} analyzed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setPages(prev => prev.map(p => p.id === id ? { ...p, loading: false } : p));
      toast.error(`Analysis failed: ${msg}`);
    }
  }

  async function analyzeAll() {
    const unanalyzed = pages.filter(p => !p.summary && !p.flashcards && !p.keyPoints && !p.loading && !p.isScanned);
    if (unanalyzed.length === 0) { 
      toast.info("All text-based pages already analyzed or none available"); 
      return; 
    }
    
    toast.info(`Analyzing ${unanalyzed.length} pages...`);
    for (const page of unanalyzed) {
      await analyzePage(page.id, page.extractedText);
      await new Promise(r => setTimeout(r, 1500));
    }
    toast.success("All pages analyzed");
  }

  function getCurrentContent(page: PageNote): string {
    switch(outputMode) {
      case "summary": return page.summary;
      case "flashcards": return page.flashcards;
      case "keypoints": return page.keyPoints;
      default: return "";
    }
  }

  function hasContent(page: PageNote): boolean {
    return !!(page.summary || page.flashcards || page.keyPoints);
  }

  function updateNote(id: string, userNote: string) {
    setPages(prev => prev.map(p => p.id === id ? { ...p, userNote } : p));
  }

  function deletePage(id: string) {
    setPages(prev => prev.filter(p => p.id !== id));
  }

  function copyContent(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function exportNotes() {
    const content = pages
      .filter(p => hasContent(p))
      .map(p => {
        const modeLabel = { summary: "Summary", flashcards: "Flashcards", keypoints: "Key Points" };
        return `=== Page ${p.pageNum} ${p.isScanned ? '(Scanned)' : '(Text)'} ===\n${modeLabel[outputMode]}:\n${getCurrentContent(p)}\n\nMy Note: ${p.userNote || "None"}\n`;
      })
      .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ai-notes-${outputMode}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Notes exported");
  }

  function renderContent(content: string) {
    if (!content) return null;
    return content.split("\n").map((line, i) => {
      if (line.startsWith("Q:")) return <p key={i} className="text-xs font-semibold text-primary mt-1">{line}</p>;
      if (line.startsWith("A:")) return <p key={i} className="text-xs text-foreground/80 ml-2">{line}</p>;
      if (line.startsWith("•")) return <p key={i} className="text-xs text-foreground leading-relaxed pl-2">{line}</p>;
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>;
    });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Upload bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 cursor-pointer transition-all"
          data-testid="button-upload-pdf"
        >
          {loadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {loadingPdf ? (processingStatus || "Processing...") : "Upload PDF"}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
        </div>

        {pages.length > 0 && (
          <>
            {/* Output mode selector */}
            <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
              {[
                { id: "summary", label: "Summary", icon: FileText },
                { id: "flashcards", label: "Flashcards", icon: Layers },
                { id: "keypoints", label: "Key Points", icon: List },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setOutputMode(id as OutputMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${outputMode === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={analyzeAll}
              disabled={pages.some(p => p.loading) || !pages.some(p => !p.isScanned)}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border text-sm rounded-xl hover:bg-muted disabled:opacity-50 transition-all"
              data-testid="button-analyze-all"
            >
              <Sparkles size={14} className="text-primary" />
              Analyze All
            </button>

            <button
              onClick={exportNotes}
              disabled={!pages.some(p => hasContent(p))}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border text-sm rounded-xl hover:bg-muted disabled:opacity-50 transition-all"
              data-testid="button-export-notes"
            >
              <Download size={14} />
              Export
            </button>

            <span className="text-xs text-muted-foreground ml-auto">
              {pages.length} pages · {pages.filter(p => p.isScanned).length} scanned
            </span>
          </>
        )}
      </div>

      {/* Info banner for scanned pages */}
      {pages.length > 0 && pages.some(p => p.isScanned) && (
        <div className="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-600 dark:text-yellow-400">
          <Scan size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Some pages appear to be scanned images. OCR is not enabled in this version. 
            Please use a text-based PDF for full functionality.
          </span>
        </div>
      )}

      {/* Page grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {pages.length === 0 && !loadingPdf ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <ImageIcon size={28} className="text-muted-foreground/60" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">AI PDF Notes Maker</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload any PDF — text-based or scanned. AI will extract content and generate summaries, flashcards, or key points.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Uses Groq + PDF.js · Text-based PDFs only
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            <AnimatePresence>
              {pages.map(page => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
                >
                  {/* Page thumbnail */}
                  <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                    <img
                      src={page.imageDataUrl}
                      alt={`Page ${page.pageNum}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-black/60 rounded-lg text-xs text-white font-medium">
                        Page {page.pageNum}
                      </span>
                      {page.isScanned ? (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/80 rounded-lg text-[9px] text-white font-medium">
                          <Scan size={9} /> Scanned
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/80 rounded-lg text-[9px] text-white font-medium">
                          <Type size={9} /> Text
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deletePage(page.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-red-500/80 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {outputMode === "summary" && "Summary"}
                        {outputMode === "flashcards" && "Flashcards"}
                        {outputMode === "keypoints" && "Key Points"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasContent(page) && (
                          <button
                            onClick={() => copyContent(page.id, getCurrentContent(page))}
                            className="p-1 rounded hover:bg-secondary transition-colors"
                          >
                            {copiedId === page.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        )}
                        <button
                          onClick={() => analyzePage(page.id, page.extractedText)}
                          disabled={page.loading || page.isScanned}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            page.isScanned 
                              ? "bg-muted text-muted-foreground cursor-not-allowed" 
                              : "bg-primary/15 text-primary hover:bg-primary/25"
                          }`}
                        >
                          {page.loading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {page.loading ? "Analyzing..." : page.isScanned ? "N/A" : hasContent(page) ? "Re-analyze" : "Analyze"}
                        </button>
                      </div>
                    </div>

                    {/* Extracted text preview */}
                    {page.extractedText && !page.extractedText.startsWith("[Page") && (
                      <p className="text-[10px] text-muted-foreground/60 line-clamp-2 bg-secondary/30 rounded px-2 py-1">
                        {page.extractedText.substring(0, 120)}...
                      </p>
                    )}

                    {/* AI Output */}
                    {page.loading ? (
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-secondary rounded-full w-full animate-pulse" />
                        <div className="h-2.5 bg-secondary rounded-full w-4/5 animate-pulse" />
                        <div className="h-2.5 bg-secondary rounded-full w-3/5 animate-pulse" />
                      </div>
                    ) : page.isScanned ? (
                      <div className="bg-secondary/30 rounded-lg px-2.5 py-2 min-h-[60px] flex items-center">
                        <p className="text-xs text-muted-foreground/60 italic">
                          This page is a scanned image. Please use a text-based PDF.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-secondary/30 rounded-lg px-2.5 py-2 min-h-[60px] max-h-[150px] overflow-y-auto">
                        {hasContent(page) ? (
                          renderContent(getCurrentContent(page))
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic">Click Analyze to generate {outputMode}</p>
                        )}
                      </div>
                    )}

                    {/* User note */}
                    <div>
                      <div
                        className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors mb-1"
                        onClick={() => setExpandedId(expandedId === page.id ? null : page.id)}
                      >
                        <Lightbulb size={10} />
                        My Note
                        {expandedId === page.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </div>
                      <AnimatePresence>
                        {(expandedId === page.id || page.userNote) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <textarea
                              value={page.userNote}
                              onChange={e => updateNote(page.id, e.target.value)}
                              placeholder="Add your personal note..."
                              rows={2}
                              className="w-full text-xs bg-secondary/50 rounded-lg px-2.5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}