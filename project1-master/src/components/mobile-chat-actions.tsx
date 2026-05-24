"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { ComponentType } from "react";
import {
  Bath,
  Droplets,
  HandHeart,
  HeartPulse,
  Languages,
  Mic,
  Moon,
  Pill,
  SendHorizontal,
  ShieldAlert,
  Snowflake,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/cn";

type SendAction = (formData: FormData) => void | Promise<void>;
type Need = {
  id: string;
  en: string;
  es: string;
  label: string;
  labelEs: string;
  Icon: ComponentType<{ className?: string }>;
};

const NEEDS: Need[] = [
  { id: "pain", en: "Pain", es: "Dolor", label: "Pain", labelEs: "Dolor", Icon: HeartPulse },
  { id: "bathroom", en: "Bathroom", es: "Ba\u00f1o", label: "Bathroom", labelEs: "Ba\u00f1o", Icon: Bath },
  { id: "hungry", en: "Hungry", es: "Hambre", label: "Hungry", labelEs: "Hambre", Icon: Utensils },
  { id: "thirsty", en: "Thirsty", es: "Sed", label: "Thirsty", labelEs: "Sed", Icon: Droplets },
  { id: "help", en: "Need help", es: "Ayuda", label: "Help", labelEs: "Ayuda", Icon: HandHeart },
  { id: "cold", en: "Cold", es: "Fr\u00edo", label: "Cold", labelEs: "Fr\u00edo", Icon: Snowflake },
  { id: "tired", en: "Tired", es: "Cansado", label: "Tired", labelEs: "Cansado", Icon: Moon },
  { id: "scared", en: "Scared", es: "Miedo", label: "Scared", labelEs: "Miedo", Icon: ShieldAlert },
  { id: "medicine", en: "Medicine", es: "Medicina", label: "Medicine", labelEs: "Medicina", Icon: Pill },
];

export function MobileChatActions({
  action,
  placeholder,
  maxLength,
}: {
  action: SendAction;
  placeholder: string;
  maxLength: number;
}) {
  const [spanishMode, setSpanishMode] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);

  return (
    <section className="sticky bottom-20 z-20 border-t border-[var(--mobile-line)] bg-[var(--mobile-cream)] px-3 pb-3 pt-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--mobile-muted)]">
          <Mic className="size-3.5 text-[var(--mobile-gold)]" />
          <span>{spanishMode ? "Toca para hablar" : "Tap to speak"}</span>
        </div>
        <button
          type="button"
          onClick={() => setSpanishMode((value) => !value)}
          className="min-h-8 rounded-full border border-[var(--mobile-line)] bg-[var(--surface)] px-3 text-[12px] font-bold text-[var(--mobile-gold-deep)] transition active:scale-95"
        >
          <span className="inline-flex items-center gap-1.5">
            <Languages className="size-3.5" />
            {spanishMode ? "ES / EN" : "EN / ES"}
          </span>
        </button>
      </div>

      <div className="mobile-need-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-3 pt-1">
        {NEEDS.map((need) => (
          <form
            key={need.id}
            action={action}
            onSubmit={() => setSelectedNeed(need.id)}
            className="shrink-0"
          >
            <input
              type="hidden"
              name="body"
              value={spanishMode ? `Necesito: ${need.es}` : `I need: ${need.en}`}
            />
            <NeedButton
              need={need}
              selected={selectedNeed === need.id}
              spanishMode={spanishMode}
            />
          </form>
        ))}
      </div>

      <form action={action} className="rounded-[18px] border border-[var(--mobile-line)] bg-[var(--surface)] p-1">
        <div className="flex items-end gap-2">
          <textarea
            name="body"
            required
            maxLength={maxLength}
            rows={1}
            placeholder={spanishMode ? "Escribe o toca una necesidad..." : placeholder}
            className="min-h-10 flex-1 resize-none rounded-[14px] border border-transparent bg-transparent px-3 py-2.5 text-[15px] leading-5 text-[var(--mobile-ink)] outline-none placeholder:text-[var(--mobile-muted)] focus:border-[var(--mobile-line)]"
          />
          <ComposerSubmitButton />
        </div>
      </form>
    </section>
  );
}

function NeedButton({
  need,
  selected,
  spanishMode,
}: {
  need: Need;
  selected: boolean;
  spanishMode: boolean;
}) {
  const { pending } = useFormStatus();
  const Icon = need.Icon;

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={selected}
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-center text-[12px] font-semibold transition active:scale-95 disabled:cursor-wait disabled:opacity-70",
        selected
          ? "border-[var(--mobile-gold)] bg-[var(--mobile-gold)] text-[#1b1712]"
          : "border-[var(--mobile-line)] bg-[var(--surface)] text-[var(--mobile-ink)] hover:bg-[var(--surface-2)]",
      )}
    >
      <Icon
        className={cn(
          "size-4",
          selected ? "text-[#1b1712]" : "text-[var(--mobile-gold)]",
        )}
      />
      <span className="leading-none">{spanishMode ? need.labelEs : need.label}</span>
    </button>
  );
}

function ComposerSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Send message"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--mobile-line)] bg-[var(--mobile-ink)] text-[var(--mobile-cream)] transition active:scale-95 disabled:cursor-wait disabled:opacity-70"
    >
      <SendHorizontal className="size-5" />
    </button>
  );
}
