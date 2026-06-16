import { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, Trash2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const BACKEND_URL = "http://127.0.0.1:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
  sources?: { page: number; text: string }[];
}

async function askBackend(question: string): Promise<{ answer: string; sources: { page: number; text: string }[] }> {
  const res = await fetch(`${BACKEND_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k: 5 }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export default function GPT() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm DocMind GPT. Upload a PDF via Semantic Search first, then ask me questions and I'll find the most relevant passages from your document.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const loadingMsg: Message = { id: Date.now() + "l", role: "assistant", content: "", loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);

    try {
      const { answer, sources } = await askBackend(text);
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: answer, sources, loading: false } : m
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reach backend";
      toast.error(msg);
      setMessages(prev => prev.filter(m => !m.loading));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function clearChat() {
    setMessages([{ id: "w2", role: "assistant", content: "Chat cleared. Upload a PDF and ask me anything!" }]);
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Powered by your local FastAPI backend — no API key needed</span>
        </div>
        <button onClick={clearChat}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
          data-testid="button-clear-chat">
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={13} className="text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary/15 text-foreground rounded-tr-sm"
                      : "bg-secondary text-foreground rounded-tl-sm"
                  }`}>
                    {msg.loading
                      ? <div className="flex items-center gap-2 py-1">
                          <Loader2 size={13} className="animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Searching document...</span>
                        </div>
                      : <p className="whitespace-pre-wrap">{msg.content}</p>
                    }
                  </div>
                  {/* Source pages */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap px-1">
                      {[...new Set(msg.sources.map(s => s.page))].map(page => (
                        <span key={page} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Page {page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-xl bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={13} className="text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2 items-end">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask anything about your uploaded PDF... (Enter to send)"
            rows={1}
            className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-28 overflow-y-auto"
            data-testid="input-gpt-message" />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
            data-testid="button-gpt-send">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}