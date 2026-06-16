import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Search, FileText, Zap, BookOpen, Mic,
  ChevronLeft, ChevronRight, Sparkles, Youtube,
  Image as ImageIcon, Settings,
} from "lucide-react";

export type DashboardView =
  | "home" | "pdf-search" | "summarizer" | "key-points" | "notes" | "voice"
  | "gpt" | "youtube" | "image-notes" | "settings";

interface SidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: DashboardView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const coreItems: NavItem[] = [
  { id: "home",       label: "Semantic Search",  icon: Home },
  { id: "pdf-search", label: "PDF Search",        icon: Search },
  { id: "summarizer", label: "PDF Summarizer",    icon: FileText },
  { id: "key-points", label: "Key Points",        icon: Zap },
  { id: "notes",      label: "Notes Maker",       icon: BookOpen },
  { id: "voice",      label: "Voice Summarizer",  icon: Mic },
];

const aiItems: NavItem[] = [
  { id: "gpt",         label: "DocMind GPT",         icon: Sparkles },
  { id: "youtube",     label: "YouTube Summarizer",   icon: Youtube },
  { id: "image-notes", label: "AI Image Notes",       icon: ImageIcon },
];

function NavButton({
  item, isActive, collapsed, onClick,
}: { item: NavItem; isActive: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
      data-testid={`nav-${item.id}`}
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={16} className="flex-shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="whitespace-nowrap overflow-hidden text-left"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 border-t border-border/50" />;
  return (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
      {label}
    </p>
  );
}

export default function Sidebar({ activeView, onViewChange, collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex-shrink-0 bg-card border-r border-border flex flex-col h-full overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
          <FileText size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-2.5 font-bold text-sm whitespace-nowrap overflow-hidden"
            >
              DocMind AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        <SectionLabel label="Core Tools" collapsed={collapsed} />
        {coreItems.map(item => (
          <NavButton key={item.id} item={item} isActive={activeView === item.id} collapsed={collapsed} onClick={() => onViewChange(item.id)} />
        ))}

        <SectionLabel label="AI Features" collapsed={collapsed} />
        {aiItems.map(item => (
          <NavButton key={item.id} item={item} isActive={activeView === item.id} collapsed={collapsed} onClick={() => onViewChange(item.id)} />
        ))}
      </nav>

      {/* Settings + Toggle */}
      <div className="p-2 border-t border-border space-y-1">
        <NavButton
          item={{ id: "settings", label: "Settings", icon: Settings }}
          isActive={activeView === "settings"}
          collapsed={collapsed}
          onClick={() => onViewChange("settings")}
        />
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
