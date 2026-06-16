import { useState } from "react";
import { Eye, EyeOff, RotateCcw, Save, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";

interface RowProps { label: string; description?: string; children: React.ReactNode }
function Row({ label, description, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface SectionProps { title: string; children: React.ReactNode }
function Section({ title, children }: SectionProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-secondary/30">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { setTheme } = useTheme();
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    toast.success("Settings saved");
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    resetSettings();
    toast.success("Settings reset to defaults");
  }

  function handleThemeChange(theme: "dark" | "light" | "system") {
    updateSetting("theme", theme);
    setTheme(theme);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">Customize DocMind AI to your preferences</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary border border-border text-sm rounded-xl hover:bg-muted transition-all"
            data-testid="button-reset-settings"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-xl hover:opacity-90 transition-all"
            data-testid="button-save-settings"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <Row label="Theme" description="Choose your preferred color scheme">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {(["light", "dark", "system"] as const).map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${settings.theme === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`button-theme-${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Show Confidence Scores" description="Display AI confidence percentages where available">
          <Switch
            checked={settings.showConfidenceScores}
            onCheckedChange={v => updateSetting("showConfidenceScores", v)}
            data-testid="switch-confidence-scores"
          />
        </Row>
      </Section>

      {/* AI & Models */}
      <Section title="AI &amp; Models">
        <Row label="Hugging Face API Token" description="Optional — speeds up requests and avoids rate limits. Free at huggingface.co">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={settings.hfApiToken}
                onChange={e => updateSetting("hfApiToken", e.target.value)}
                placeholder="hf_xxxxxxxxxxxx"
                className="w-44 bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary pr-8"
                data-testid="input-hf-token"
              />
              <button
                onClick={() => setShowToken(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </Row>
        <Row label="Default Summary Length" description="Used in PDF Summarizer">
          <div className="flex gap-1">
            {(["short", "medium", "detailed"] as const).map(l => (
              <button
                key={l}
                onClick={() => updateSetting("defaultSummaryLength", l)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${settings.defaultSummaryLength === l ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                data-testid={`button-summary-length-${l}`}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Language" description="Preferred language for AI outputs">
          <select
            value={settings.language}
            onChange={e => updateSetting("language", e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="select-language"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ar">Arabic</option>
          </select>
        </Row>
      </Section>

      {/* GPT Settings */}
      <Section title="DocMind GPT">
        <Row label="AI Persona" description="System prompt used when chatting with DocMind GPT">
          <div />
        </Row>
        <div className="pb-4">
          <textarea
            value={settings.gptPersona}
            onChange={e => updateSetting("gptPersona", e.target.value)}
            rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            data-testid="textarea-gpt-persona"
          />
        </div>
      </Section>

      {/* Voice Settings */}
      <Section title="Voice Summarizer">
        <Row label="Auto-save notes" description="Save notes to database automatically after editing">
          <Switch
            checked={settings.autoSaveNotes}
            onCheckedChange={v => updateSetting("autoSaveNotes", v)}
            data-testid="switch-auto-save"
          />
        </Row>
        <Row label="Default Speech Rate" description={`${settings.voiceRate.toFixed(1)}x speed`}>
          <div className="w-36">
            <Slider
              min={0.5} max={2} step={0.1}
              value={[settings.voiceRate]}
              onValueChange={([v]) => updateSetting("voiceRate", v)}
              data-testid="slider-default-rate"
            />
          </div>
        </Row>
        <Row label="Default Pitch" description={`${settings.voicePitch.toFixed(1)}`}>
          <div className="w-36">
            <Slider
              min={0.5} max={2} step={0.1}
              value={[settings.voicePitch]}
              onValueChange={([v]) => updateSetting("voicePitch", v)}
              data-testid="slider-default-pitch"
            />
          </div>
        </Row>
        <Row label="Words per Voice Chunk" description="How many words per audio segment">
          <div className="w-36">
            <Slider
              min={20} max={120} step={5}
              value={[settings.maxChunkWords]}
              onValueChange={([v]) => updateSetting("maxChunkWords", v)}
              data-testid="slider-chunk-words"
            />
          </div>
        </Row>
      </Section>

      {/* About */}
      <Section title="About">
        <Row label="DocMind AI" description="AI-powered PDF knowledge platform — all AI features use free Hugging Face public models. No paid API keys required.">
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-lg">v1.0</span>
        </Row>
        <Row label="Models Used" description="">
          <div />
        </Row>
        <div className="pb-4 space-y-1.5">
          {[
            ["PDF Summarizer", "facebook/bart-large-cnn"],
            ["Key Points", "ml6team/keyphrase-extraction-kbir-inspec"],
            ["DocMind GPT", "mistralai/Mistral-7B-Instruct-v0.1"],
            ["YouTube Summary", "facebook/bart-large-cnn"],
            ["Image Captioning", "Salesforce/blip-image-captioning-base"],
          ].map(([feature, model]) => (
            <div key={model} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{feature}</span>
              <code className="bg-secondary rounded-lg px-2 py-0.5 text-primary font-mono">{model}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
