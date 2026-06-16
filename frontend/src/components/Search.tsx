import { useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  page: number;
  text: string;
}

const STOPWORDS = new Set(["the","is","of","a","an","in","to","and","or","for","on","at","by","with","as","it","its","that","this","are","was","be","from","has","have"]);

function highlight(text: string, query: string) {
  const words = query.trim().split(" ").filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  if (words.length === 0) return text;
  const regex = new RegExp(`\\b(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})\\b`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200/80 dark:bg-yellow-500/30 text-foreground rounded px-0.5">{part}</mark> : part
  );
}

interface SearchProps {
  onPageSelect?: (page: number) => void;
}

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Search({ onPageSelect }: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setError("Search failed. Make sure your FastAPI backend is running at port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything in your document..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            data-testid="input-search-query"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          data-testid="button-search"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <SearchIcon size={14} />}
          Search
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onPageSelect?.(r.page)}
              className="p-4 bg-secondary border border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
              data-testid={`search-result-${i}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Result {i + 1}</span>
                <span className="ml-auto text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                  Page {r.page}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {highlight(r.text, query)}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        {results.length === 0 && !loading && query && (
          <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
        )}
      </div>
    </div>
  );
}
