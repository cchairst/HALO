"use client";

import { Languages, Volume2 } from "lucide-react";
import { useState, useTransition } from "react";
import { translateForCare } from "@/app/clinical-actions";

const TARGETS = [
  { code: "en", label: "EN", speech: "en-US" },
  { code: "es", label: "ES", speech: "es-ES" },
  { code: "ht", label: "HT", speech: "ht-HT" },
  { code: "tl", label: "TL", speech: "tl-PH" },
];

function speechLocale(code: string) {
  return TARGETS.find((target) => target.code === code)?.speech ?? "en-US";
}

export function TranslateMessageButton({ text }: { text: string }) {
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translated, setTranslated] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function translate() {
    setError("");
    startTransition(async () => {
      const result = await translateForCare({
        text,
        sourceLanguage: "auto",
        targetLanguage,
      });
      if (result.ok) setTranslated(result.translatedText);
      else setError(result.error);
    });
  }

  function speak() {
    if (!translated) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translated);
    utterance.lang = speechLocale(targetLanguage);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="mt-1 flex flex-col gap-1 px-1">
      <div className="flex items-center gap-1.5">
        <select
          value={targetLanguage}
          onChange={(event) => setTargetLanguage(event.target.value)}
          className="h-6 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-[10px] text-[var(--muted)] outline-none"
        >
          {TARGETS.map((target) => (
            <option key={target.code} value={target.code}>
              {target.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={translate}
          disabled={pending}
          className="inline-flex h-6 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-[10px] font-semibold text-[var(--muted)] disabled:opacity-50"
        >
          <Languages className="size-3" />
          {pending ? "..." : "Translate"}
        </button>
        {translated && (
          <button
            type="button"
            onClick={speak}
            className="inline-flex h-6 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-[10px] font-semibold text-[var(--muted)]"
          >
            <Volume2 className="size-3" />
            Play
          </button>
        )}
      </div>
      {translated && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[12px] leading-4 text-[var(--ink-2)]">
          {translated}
        </div>
      )}
      {error && <div className="text-[10px] text-[var(--muted)]">{error}</div>}
    </div>
  );
}
