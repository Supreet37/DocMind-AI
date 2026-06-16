import { useState, useRef } from "react";
import { Upload, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Search from "./Search";
import { toast } from "sonner";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function PDFSearchPage() {
  const [uploaded, setUploaded] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);

  async function handleFileUpload(file: File) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      setUploadError(null);
      const response = await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `Upload failed: ${response.status}`);
      setUploaded(true);
      toast.success(`${file.name} uploaded — ${data.pages} pages`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      setUploaded(false);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setUploaded(false);
    setUploadError(null);
    setCurrentPage(1);
    handleFileUpload(file);
  }

  function goToPage(page: number) {
    const p = Math.max(1, page);
    setCurrentPage(p);
    if (pdfViewerRef.current && pdfUrl) {
      pdfViewerRef.current.src = `${pdfUrl}#page=${p}&toolbar=1&navpanes=1`;
    }
  }

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* PDF Viewer */}
      <div className="flex-1 min-w-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
        {!pdfUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No PDF loaded</h3>
            <p className="text-sm text-muted-foreground mb-6">Upload a PDF to view and search it</p>
            <label className="cursor-pointer">
              <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" data-testid="input-pdf-upload" />
              <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? "Uploading..." : "Choose PDF"}
              </div>
            </label>
            {uploadError && (
              <p className="mt-4 text-sm text-destructive max-w-xs">{uploadError}</p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText size={14} className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate text-foreground">{fileName}</span>
                {uploaded && <span className="text-xs px-2 py-0.5 bg-green-500/15 text-green-500 rounded-full flex-shrink-0">Ready</span>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-prev-page"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground text-xs">Page</span>
                  <input
                    type="number"
                    min="1"
                    value={currentPage}
                    onChange={e => goToPage(parseInt(e.target.value) || 1)}
                    className="w-12 text-center py-0.5 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    data-testid="input-page-number"
                  />
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  data-testid="button-next-page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" data-testid="input-pdf-replace" />
                <span className="text-xs text-primary hover:underline cursor-pointer">Replace</span>
              </label>
            </div>
            <div className="flex-1">
              <iframe
                ref={pdfViewerRef}
                src={`${pdfUrl}#toolbar=1&navpanes=1&page=${currentPage}`}
                className="w-full h-full border-none"
                title="PDF Viewer"
                data-testid="pdf-iframe"
              />
            </div>
          </>
        )}
      </div>

      {/* Search panel */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-card border border-border rounded-2xl p-4 overflow-hidden">
        <h3 className="font-semibold text-foreground mb-4 text-sm">Search Document</h3>
        {!uploaded ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Upload a PDF to start searching</p>
            {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <Search onPageSelect={page => { goToPage(page); }} />
          </div>
        )}
      </div>
    </div>
  );
}
