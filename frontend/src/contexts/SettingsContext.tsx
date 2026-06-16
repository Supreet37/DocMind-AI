import React from "react";
import { createContext, useContext, useState, useEffect } from "react";

export interface AppSettings {
  hfApiToken: string;
  defaultSummaryLength: "short" | "medium" | "detailed";
  language: string;
  autoSaveNotes: boolean;
  voiceRate: number;
  voicePitch: number;
  gptPersona: string;
  theme: "dark" | "light" | "system";
  showConfidenceScores: boolean;
  maxChunkWords: number;
}

const DEFAULTS: AppSettings = {
  hfApiToken: "",
  defaultSummaryLength: "medium",
  language: "en",
  autoSaveNotes: true,
  voiceRate: 1,
  voicePitch: 1,
  gptPersona: "You are DocMind AI, an expert at analyzing and explaining PDF documents clearly and concisely.",
  theme: "dark",
  showConfidenceScores: true,
  maxChunkWords: 60,
};

const STORAGE_KEY = "docmind_settings";

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function resetSettings() {
    setSettings(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
