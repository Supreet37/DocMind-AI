import { useState } from "react";
import { Plus, Trash2, Save, FileText, Loader2, BookOpen, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = "http://127.0.0.1:8000";

type Note = {
  id: number;
  title: string;
  content: string;
  pdfName: string;
  updatedAt: string;
};

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchNotes = (): Promise<Note[]> =>
  fetch(`${API}/notes`).then(r => r.json());

const createNote = (data: { title: string; content: string; pdfName: string }): Promise<Note> =>
  fetch(`${API}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());

const updateNote = (id: number, data: { title?: string; content?: string }): Promise<Note> =>
  fetch(`${API}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());

const deleteNote = (id: number): Promise<{ ok: boolean }> =>
  fetch(`${API}/notes/${id}`, { method: "DELETE" }).then(r => r.json());

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotesMaker() {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; content?: string } }) =>
      updateNote(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPdf, setEditPdf] = useState("Untitled PDF");
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedNote = notes.find(n => n.id === selectedId) ?? null;

  function handleSelect(id: number) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setSelectedId(id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditPdf(note.pdfName);
    setIsCreating(false);
  }

  function handleNew() {
    setSelectedId(null);
    setEditTitle("New Note");
    setEditContent("");
    setEditPdf("Untitled PDF");
    setIsCreating(true);
  }

  async function handleSave() {
    if (!editTitle.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (isCreating) {
        await createMutation.mutateAsync({ title: editTitle, content: editContent, pdfName: editPdf });
        toast.success("Note created");
        setIsCreating(false);
      } else if (selectedId) {
        await updateMutation.mutateAsync({ id: selectedId, data: { title: editTitle, content: editContent } });
        toast.success("Note saved");
      }
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) { setSelectedId(null); setIsCreating(false); }
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  const hasChanges = selectedNote
    ? editTitle !== selectedNote.title || editContent !== selectedNote.content
    : isCreating;

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Notes list */}
      <div className="w-64 flex-shrink-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
          <span className="text-sm font-semibold">Notes</span>
          <button
            onClick={handleNew}
            className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
            data-testid="button-new-note"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : notes.length === 0 && !isCreating ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <BookOpen size={24} className="text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No notes yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click + to create one</p>
            </div>
          ) : (
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <p className="text-xs font-medium text-primary truncate">{editTitle || "New Note"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Unsaved</p>
                </motion.div>
              )}
              {notes.map(note => (
                <motion.button
                  key={note.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleSelect(note.id)}
                  className={`w-full text-left p-3 rounded-xl group transition-all flex items-start justify-between gap-2 ${
                    selectedId === note.id && !isCreating
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-secondary border border-transparent"
                  }`}
                  data-testid={`note-item-${note.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{note.pdfName}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                    data-testid={`button-delete-note-${note.id}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        {!selectedId && !isCreating ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <Edit3 size={32} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                  data-testid="input-note-title"
                />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FileText size={10} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={editPdf}
                    onChange={e => setEditPdf(e.target.value)}
                    placeholder="PDF name..."
                    className="bg-transparent text-xs text-muted-foreground focus:outline-none w-40"
                    data-testid="input-note-pdf-name"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-all"
                data-testid="button-save-note"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              placeholder="Start writing your notes here..."
              className="flex-1 p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
              data-testid="textarea-note-content"
            />
            {editContent.trim() && (
              <div className="px-4 py-2 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {editContent.split(/\s+/).filter(Boolean).length} words
                </span>
                {selectedNote?.updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Last saved {new Date(selectedNote.updatedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}