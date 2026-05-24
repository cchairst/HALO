"use client";

import { Languages, Mic, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { translateForCare } from "@/app/clinical-actions";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const LANGUAGES = [
  { code: "en", label: "English", speech: "en-US" },
  { code: "es", label: "Spanish", speech: "es-ES" },
  { code: "ht", label: "Creole", speech: "ht-HT" },
  { code: "tl", label: "Tagalog", speech: "tl-PH" },
  { code: "vi", label: "Vietnamese", speech: "vi-VN" },
  { code: "zh", label: "Chinese", speech: "zh-CN" },
  { code: "ar", label: "Arabic", speech: "ar-SA" },
];

function speechLocale(code: string) {
  return LANGUAGES.find((language) => language.code === code)?.speech ?? "en-US";
}

export function LiveTranslatePanel({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [pending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function translate(value = text) {
    setError("");
    setTranslated("");
    startTransition(async () => {
      const result = await translateForCare({
        text: value,
        sourceLanguage,
        targetLanguage,
      });
      if (result.ok) {
        setTranslated(result.translatedText);
      } else {
        setError(result.error);
      }
    });
  }

  function listen() {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech input is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLocale(sourceLanguage);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setText(transcript);
      if (transcript) translate(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Could not hear that clearly.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function speak() {
    if (!translated) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translated);
    utterance.lang = speechLocale(targetLanguage);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className={compact ? "px-3 pb-2" : ""}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)]"
      >
        <Languages className="size-4 text-[var(--gold-soft)]" />
        Live translate
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  From {language.label}
                </option>
              ))}
            </select>
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  To {language.label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            placeholder="Type or tap mic"
            className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={listen}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--ink)]"
            >
              <Mic className="size-4 text-[var(--gold-soft)]" />
              {listening ? "Stop" : "Speak"}
            </button>
            <button
              type="button"
              onClick={() => translate()}
              disabled={pending}
              className="inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--accent-fg)] disabled:opacity-50"
            >
              {pending ? "Translating" : "Translate"}
            </button>
            <button
              type="button"
              onClick={speak}
              disabled={!translated}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--ink)] disabled:opacity-40"
            >
              <Volume2 className="size-4 text-[var(--gold-soft)]" />
              Play
            </button>
          </div>

          {translated && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[14px] leading-5 text-[var(--ink)]">
              {translated}
            </div>
          )}
          {error && <div className="mt-2 text-[12px] text-[var(--muted)]">{error}</div>}
        </div>
      )}
    </div>
  );
}
