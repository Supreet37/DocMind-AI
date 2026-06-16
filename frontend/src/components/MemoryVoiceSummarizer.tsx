import { useState, useRef, useEffect } from "react";
import { Mic, Play, Pause, Square, Download, Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Chunk {
  index: number;
  text: string;
  duration?: number;
}

function splitIntoChunks(text: string, wordsPerChunk = 50): Chunk[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: Chunk[] = [];
  let current: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    if (wordCount + words.length > wordsPerChunk && current.length > 0) {
      chunks.push({ index: chunks.length, text: current.join(" ") });
      current = [];
      wordCount = 0;
    }
    current.push(sentence.trim());
    wordCount += words.length;
  }
  if (current.length > 0) chunks.push({ index: chunks.length, text: current.join(" ") });
  return chunks.length > 0 ? chunks : [{ index: 0, text: text.slice(0, 500) }];
}

export default function MemoryVoiceSummarizer() {
  const [inputText, setInputText] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [generated, setGenerated] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        const english = v.find(voice => voice.lang.startsWith("en") && !voice.name.toLowerCase().includes("compact"));
        setSelectedVoice(english || v[0]);
      }
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  function handleGenerate() {
    if (!inputText.trim()) { toast.error("Enter some text first"); return; }
    const c = splitIntoChunks(inputText, 60);
    setChunks(c);
    setCurrentChunk(0);
    setGenerated(true);
    stopSpeech();
    toast.success(`Generated ${c.length} audio chunks`);
  }

  function speakChunk(index: number) {
    window.speechSynthesis.cancel();
    if (index >= chunks.length) { setIsPlaying(false); setIsPaused(false); return; }

    const utterance = new SpeechSynthesisUtterance(chunks[index].text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); setCurrentChunk(index); };
    utterance.onend = () => {
      if (index + 1 < chunks.length) {
        speakChunk(index + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        toast.success("Playback complete");
      }
    };
    utterance.onerror = () => { setIsPlaying(false); };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function handlePlay() {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      speakChunk(currentChunk);
    }
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }

  function handleDownload() {
    const content = chunks.map((c, i) => `--- Chunk ${i + 1} ---\n${c.text}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "voice-summary-chunks.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Chunks exported");
  }

  const progress = chunks.length > 0 ? ((currentChunk) / chunks.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Input */}
        <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <h3 className="text-sm font-semibold">Content to Speak</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Paste key points or summary text to convert to speech</p>
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste your key points, summary, or any text here to generate audio chunks for memorization..."
            className="flex-1 p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
            data-testid="textarea-voice-input"
          />
          <div className="p-3 border-t border-border flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {inputText.split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={handleGenerate}
              disabled={!inputText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              data-testid="button-generate-audio"
            >
              <Wand2 size={14} />
              Generate Chunks
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Audio Player</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Uses browser Web Speech API — no API key needed</p>
            </div>
            <Mic size={16} className={`${isPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          </div>

          <div className="flex-1 flex flex-col p-4 gap-4">
            {generated ? (
              <>
                {/* Chunk display */}
                <div className="flex-1 bg-secondary/30 rounded-xl p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary">Chunk {currentChunk + 1} / {chunks.length}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { stopSpeech(); setCurrentChunk(Math.max(0, currentChunk - 1)); }}
                        disabled={currentChunk === 0}
                        className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 transition-colors"
                        data-testid="button-prev-chunk"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => { stopSpeech(); setCurrentChunk(Math.min(chunks.length - 1, currentChunk + 1)); }}
                        disabled={currentChunk >= chunks.length - 1}
                        className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 transition-colors"
                        data-testid="button-next-chunk"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {chunks[currentChunk]?.text}
                  </p>
                </div>

                {/* Progress */}
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={stopSpeech}
                    disabled={!isPlaying && !isPaused}
                    className="p-2.5 rounded-xl bg-secondary hover:bg-muted disabled:opacity-40 transition-colors border border-border"
                    data-testid="button-stop"
                  >
                    <Square size={16} />
                  </button>
                  <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="p-4 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition-colors border border-border"
                    data-testid="button-download-chunks"
                  >
                    <Download size={16} />
                  </button>
                </div>

                {/* Voice settings */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Speed</span>
                      <span className="text-xs font-medium">{rate.toFixed(1)}x</span>
                    </div>
                    <Slider
                      min={0.5} max={2} step={0.1} value={[rate]}
                      onValueChange={([v]) => setRate(v)}
                      data-testid="slider-rate"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Pitch</span>
                      <span className="text-xs font-medium">{pitch.toFixed(1)}</span>
                    </div>
                    <Slider
                      min={0.5} max={2} step={0.1} value={[pitch]}
                      onValueChange={([v]) => setPitch(v)}
                      data-testid="slider-pitch"
                    />
                  </div>
                  {voices.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Voice</span>
                      <select
                        value={selectedVoice?.name || ""}
                        onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value) || null)}
                        className="w-full text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        data-testid="select-voice"
                      >
                        {voices.filter(v => v.lang.startsWith("en")).map(v => (
                          <option key={v.name} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Mic size={36} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Enter text and click Generate Chunks</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Uses your browser's built-in speech synthesis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chunk list */}
      {generated && chunks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <span className="text-sm font-semibold">{chunks.length} Audio Chunks</span>
          </div>
          <div className="flex gap-2 p-3 overflow-x-auto">
            {chunks.map((chunk, i) => (
              <button
                key={i}
                onClick={() => { stopSpeech(); setCurrentChunk(i); }}
                className={`flex-shrink-0 w-10 h-10 rounded-xl text-xs font-medium transition-all ${
                  i === currentChunk
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`chunk-button-${i}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
