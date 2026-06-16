import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  Search, FileText, Zap, BookOpen, Mic, Check, ArrowRight,
  ChevronRight, Menu, X, Sparkles, Youtube, Image,
  Star, ChevronDown, Mail, Github, Twitter, Linkedin,
  MessageSquare, Shield, Clock, Users,
} from "lucide-react";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

/* ─── data ────────────────────────────────────────────────────────────── */

const features = [
  { icon: Search,       title: "Semantic Search",         desc: "Find anything instantly — AI understands context, not just keywords.",               gradient: "from-indigo-500 to-violet-500" },
  { icon: FileText,     title: "PDF Summarizer",           desc: "Get concise, accurate summaries of any document in seconds.",                        gradient: "from-violet-500 to-purple-500" },
  { icon: Zap,          title: "Key Points Extractor",     desc: "Extract crucial information automatically — never miss the key ideas.",              gradient: "from-purple-500 to-fuchsia-500" },
  { icon: BookOpen,     title: "Smart Notes",              desc: "Create, organize, and export notes while you read — synced and searchable.",         gradient: "from-fuchsia-500 to-pink-500" },
  { icon: Sparkles,     title: "DocMind GPT",              desc: "Chat with your PDF — ask complex questions and get intelligent answers instantly.",  gradient: "from-indigo-500 to-blue-500" },
  { icon: Youtube,      title: "YouTube Summarizer",       desc: "Summarize any YouTube video transcript in seconds with a single URL.",               gradient: "from-red-500 to-orange-500" },
  { icon: Image,        title: "AI Image Notes",           desc: "Auto-caption every PDF page using BLIP vision AI and add your own notes.",           gradient: "from-green-500 to-teal-500" },
  { icon: Mic,          title: "Voice Summarizer",         desc: "Listen to AI summaries with browser-native speech — hands-free learning.",          gradient: "from-cyan-500 to-indigo-500" },
];

const steps = [
  { step: "01", title: "Upload your PDF",         desc: "Drag and drop any PDF document to get started instantly." },
  { step: "02", title: "AI analyzes content",     desc: "Our models parse, chunk, and embed your document for deep semantic understanding." },
  { step: "03", title: "Search, summarize & learn", desc: "Ask questions, generate summaries, extract key points, and build memory notes." },
];

const tiers = [
  {
    name: "Free", price: "$0", period: "forever",
    desc: "Perfect for occasional use",
    features: ["3 PDFs per month", "Basic semantic search", "5 AI summaries", "Smart notes", "Export notes"],
    cta: "Get started", highlight: false,
  },
  {
    name: "Pro", price: "$9.99", period: "per month",
    desc: "For power users and researchers",
    features: ["Unlimited PDFs", "Advanced semantic search", "Unlimited AI summaries", "Key points extractor", "Memory voice summarizer", "DocMind GPT chat", "Priority processing"],
    cta: "Start Pro trial", highlight: true,
  },
  {
    name: "Team", price: "$29.99", period: "per month",
    desc: "For teams and organizations",
    features: ["Everything in Pro", "Collaboration tools", "Team analytics", "Priority support", "Custom integrations", "Admin dashboard"],
    cta: "Contact sales", highlight: false,
  },
];

const testimonials = [
  { name: "Sarah K.", role: "PhD Researcher", avatar: "SK", rating: 5, text: "DocMind AI cut my literature review time in half. The semantic search is genuinely impressive — it finds relevant passages I would have missed entirely." },
  { name: "James M.", role: "Law Student", avatar: "JM", rating: 5, text: "Reading case law used to take hours. Now I upload the PDF, ask DocMind GPT the key questions, and get a full briefing in minutes." },
  { name: "Priya D.", role: "Product Manager", avatar: "PD", rating: 5, text: "The Voice Summarizer is my commute companion. I listen to AI summaries of dense reports while driving. Absolutely game-changing workflow." },
  { name: "Chen W.", role: "Data Scientist", avatar: "CW", rating: 5, text: "The YouTube Summarizer alone is worth it. I can get the gist of a 2-hour conference talk in 30 seconds. The key points extractor is spot on." },
];

const faqs = [
  { q: "Do I need an API key?",            a: "No. All AI features use free, publicly available Hugging Face models. You can optionally add your own HF token in Settings for faster responses." },
  { q: "What file formats are supported?",  a: "Currently PDF files are fully supported. We extract text and render pages for all AI-powered tools." },
  { q: "Is my data private?",              a: "Your PDFs are processed locally in your browser wherever possible. Text sent to Hugging Face models is governed by their standard privacy policy." },
  { q: "Can I use it offline?",            a: "The Notes Maker and Voice Summarizer work offline. AI features (summarization, GPT, image captioning) require an internet connection to reach the model APIs." },
  { q: "How does the free tier work?",     a: "The free tier is genuinely free forever — no credit card required. Upgrade to Pro only when you need unlimited PDFs and priority processing." },
];

const footerLinks = {
  Product:   ["Features", "How it works", "Pricing", "Changelog"],
  Resources: ["Documentation", "API Reference", "Blog", "Open Source"],
  Company:   ["About", "Careers", "Privacy Policy", "Terms of Service"],
};

const stats = [
  { label: "PDFs Processed",  value: "2M+",   icon: FileText },
  { label: "Active Users",    value: "45K+",  icon: Users },
  { label: "Avg. Time Saved", value: "3 hrs", icon: Clock },
  { label: "Uptime SLA",      value: "99.9%", icon: Shield },
];

/* ─── Particle Background ──────────────────────────────────────────────── */

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; alpha: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    // Capture non-null refs for use inside closures
    const c: HTMLCanvasElement = el;
    const g: CanvasRenderingContext2D = ctx;

    let animId: number;
    let particles: Particle[] = [];

    const COLORS = ["99,102,241", "139,92,246", "168,85,247", "217,70,239"];
    const COUNT = 80;
    const MAX_DIST = 140;

    function resize() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }

    function spawn(): Particle {
      return {
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.5 + 0.15,
      };
    }

    function init() {
      particles = Array.from({ length: COUNT }, spawn);
    }

    function draw() {
      g.clearRect(0, 0, c.width, c.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = c.width;
        if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height;
        if (p.y > c.height) p.y = 0;

        const colorIdx = Math.floor((p.x / c.width) * COLORS.length) % COLORS.length;
        g.beginPath();
        g.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        g.fillStyle = `rgba(${COLORS[colorIdx]},${p.alpha})`;
        g.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.18;
            g.beginPath();
            g.moveTo(particles[i].x, particles[i].y);
            g.lineTo(particles[j].x, particles[j].y);
            g.strokeStyle = `rgba(139,92,246,${opacity})`;
            g.lineWidth = 0.6;
            g.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    function handleResize() { resize(); init(); }

    resize();
    init();
    draw();

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}

/* ─── 3D Hero Card ─────────────────────────────────────────────────────── */

function HeroCard3D({ delay = 0, children, className = "" }: { delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Hero3DScene({ onCTA }: { onCTA: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { mouseX.set(0); mouseY.set(0); }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-4xl mx-auto"
      style={{ perspective: "1200px" }}
    >
      {/* Glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-indigo-500/10 animate-[spin_30s_linear_infinite]" />
        <div className="absolute w-[450px] h-[450px] rounded-full border border-violet-500/10 animate-[spin_20s_linear_infinite_reverse]" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-purple-500/10 animate-[spin_15s_linear_infinite]" />
      </div>

      {/* Central 3D card */}
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="relative rounded-2xl border border-border/40 bg-card/80 shadow-2xl shadow-indigo-500/10 overflow-hidden backdrop-blur-sm mx-8"
          style={{ transform: "translateZ(0px)" }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 mx-4 h-5 bg-background/40 rounded-md flex items-center px-3">
              <span className="text-[10px] text-muted-foreground/60">docmind.ai/dashboard</span>
            </div>
          </div>
          {/* App mockup */}
          <div className="grid grid-cols-5 h-56">
            <div className="col-span-1 border-r border-border/40 bg-background/30 p-2.5 space-y-1">
              {["Search", "Summarize", "Key Points", "GPT", "Notes", "Voice"].map((item, i) => (
                <div key={item} className={`h-6 rounded-lg flex items-center px-2 text-[10px] font-medium transition-all ${i === 1 ? "bg-primary/25 text-primary" : "text-muted-foreground/70"}`}>
                  {item}
                </div>
              ))}
            </div>
            <div className="col-span-4 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 bg-gradient-to-r from-indigo-500/40 to-violet-500/40 rounded-full w-32" />
                <div className="ml-auto h-6 w-20 rounded-lg bg-primary/20 border border-primary/30 text-[9px] text-primary flex items-center justify-center">Generate</div>
              </div>
              <div className="space-y-1.5 mb-4">
                {[1, 0.85, 0.7, 0.9, 0.6].map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: `${w * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                    className="h-2.5 bg-secondary/80 rounded-full"
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {["Short", "Medium", "Detailed"].map((s, i) => (
                  <div key={s} className={`h-6 rounded-lg border text-[9px] flex items-center justify-center font-medium ${i === 1 ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground/60"}`}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating chips — 3D depth via translateZ */}
      <HeroCard3D delay={0.7} className="absolute -top-4 -left-2 md:left-4">
        <div className="bg-card/90 backdrop-blur border border-indigo-500/30 rounded-2xl px-3.5 py-2.5 shadow-xl" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">DocMind GPT</p>
              <p className="text-[10px] text-muted-foreground">Mistral 7B ready</p>
            </div>
          </div>
        </div>
      </HeroCard3D>

      <HeroCard3D delay={0.9} className="absolute -top-4 -right-2 md:right-4">
        <div className="bg-card/90 backdrop-blur border border-green-500/30 rounded-2xl px-3.5 py-2.5 shadow-xl" style={{ transform: "translateZ(50px)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[11px] font-semibold text-foreground">8 AI tools</p>
            <span className="text-[10px] text-muted-foreground">all free</span>
          </div>
        </div>
      </HeroCard3D>

      <HeroCard3D delay={1.1} className="absolute -bottom-4 left-8 md:left-16">
        <div className="bg-card/90 backdrop-blur border border-violet-500/30 rounded-2xl px-3.5 py-2.5 shadow-xl" style={{ transform: "translateZ(35px)" }}>
          <div className="flex items-center gap-2">
            <Youtube size={13} className="text-red-400" />
            <p className="text-[11px] text-foreground font-medium">YouTube → Summary</p>
          </div>
        </div>
      </HeroCard3D>

      <HeroCard3D delay={1.3} className="absolute -bottom-4 right-8 md:right-16">
        <div className="bg-card/90 backdrop-blur border border-purple-500/30 rounded-2xl px-3.5 py-2.5 shadow-xl" style={{ transform: "translateZ(45px)" }}>
          <div className="flex items-center gap-2">
            <Mic size={13} className="text-cyan-400" />
            <p className="text-[11px] text-foreground font-medium">Voice Playback</p>
          </div>
        </div>
      </HeroCard3D>
    </div>
  );
}

/* ─── FAQ Item ──────────────────────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  function handleCTA() {
    isAuthenticated ? setLocation("/dashboard") : setModalOpen(true);
  }

  // Smooth scroll handler
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNav(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ scrollBehavior: "smooth" }}>
      {/* Particle background */}
      <ParticleCanvas />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-60 -left-40 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-3xl" />
      </div>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">DocMind AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {["features", "how-it-works", "pricing", "faq"].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-foreground transition-colors capitalize">
                {id.replace("-", " ")}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => setLocation("/dashboard")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-1.5" data-testid="button-goto-dashboard">
                Go to Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button onClick={() => setModalOpen(true)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-nav-login">Sign in</button>
                <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20" data-testid="button-nav-signup">Get started</button>
              </>
            )}
          </div>
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileNav(!mobileNav)} data-testid="button-mobile-nav">
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {mobileNav && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden md:hidden border-t border-border bg-background">
              <div className="px-6 py-4 flex flex-col gap-4">
                {["features", "how-it-works", "pricing", "faq"].map(id => (
                  <button key={id} onClick={() => scrollTo(id)} className="text-sm text-muted-foreground text-left capitalize">{id.replace("-", " ")}</button>
                ))}
                <button onClick={() => { setModalOpen(true); setMobileNav(false); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="button-mobile-get-started">Get started free</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-8 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                8 AI-powered tools — all free, no API key needed
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
                Transform Your PDFs{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    into Knowledge
                  </span>
                  {/* underline glow */}
                  <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-indigo-400/0 via-violet-400/60 to-purple-400/0" />
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Semantic search, GPT chat, summarization, key points, YouTube summaries, image notes, and voice playback — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCTA}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25"
                  data-testid="button-hero-cta"
                >
                  Get started free <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="px-8 py-4 bg-secondary text-secondary-foreground rounded-2xl font-semibold text-base hover:bg-muted transition-all flex items-center justify-center gap-2 border border-border"
                >
                  See how it works <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* 3D scene */}
          <Hero3DScene onCTA={handleCTA} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 border-y border-border/50 bg-secondary/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <s.icon size={18} className="text-primary/70" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Features</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Eight tools. One platform.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built for researchers, students, and knowledge workers who need to understand documents fast.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default"
                data-testid={`feature-card-${i}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon size={18} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">How it works</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Three steps to mastery</h2>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
                data-testid={`step-${i}`}
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-xl font-bold text-primary">{s.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Pricing</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, honest pricing</h2>
              <p className="text-muted-foreground text-lg">Start free, scale when you need to.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all ${tier.highlight ? "border-primary bg-gradient-to-b from-primary/10 to-card shadow-xl shadow-primary/10 scale-[1.03]" : "border-border bg-card"}`}
                data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold shadow-lg">
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm">{tier.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">/ {tier.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check size={14} className="text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleCTA}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${tier.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-secondary text-secondary-foreground hover:bg-muted border border-border"}`}
                  data-testid={`button-pricing-${tier.name.toLowerCase()}`}
                >
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Loved by knowledge workers</h2>
              <p className="text-muted-foreground text-lg">Researchers, students, and professionals who transformed how they work with documents.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                data-testid={`testimonial-${i}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">{t.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">FAQ</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Common questions</h2>
            </motion.div>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <FAQItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-purple-500/15 p-12 text-center"
          >
            {/* Decorative glows inside banner */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
                <MessageSquare size={13} />
                Start for free, no credit card
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Ready to understand any document{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">instantly?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of researchers and students who use DocMind AI to learn faster, research smarter, and save hours every week.
              </p>
              <button
                onClick={handleCTA}
                className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl shadow-indigo-500/30 inline-flex items-center gap-2"
                data-testid="button-cta-banner"
              >
                Get started free <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <FileText size={15} className="text-white" />
                </div>
                <span className="font-bold text-base">DocMind AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
                AI-powered PDF intelligence — semantic search, summarization, GPT chat, and memory tools. All free, no API key required.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Github,   label: "GitHub" },
                  { icon: Twitter,  label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map(({ icon: Icon, label }) => (
                  <a key={label} href="#" aria-label={label}
                    className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{section}</h4>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact bar */}
          <div className="border-t border-border pt-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Get in touch</h4>
                <a href="mailto:hello@docmind.ai" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail size={14} />
                  hello@docmind.ai
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Bug Report", "Feature Request", "Partnership", "Press"].map(label => (
                  <a key={label} href="#"
                    className="px-3 py-1.5 rounded-xl border border-border bg-secondary text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} DocMind AI. All rights reserved. Built with free Hugging Face models.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
