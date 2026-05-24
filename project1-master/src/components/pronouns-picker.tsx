"use client";

import { useState } from "react";

const PRESETS = ["he/him", "she/her", "they/them"] as const;
type Preset = (typeof PRESETS)[number];

function isPreset(value: string): value is Preset {
  return (PRESETS as readonly string[]).includes(value);
}

type Variant = "desktop" | "mobile";

type Props = {
  /** Form field name written to FormData. The dropdown itself is internal. */
  name?: string;
  /** Pre-fill (e.g. when editing). Empty string is treated as "unset". */
  defaultValue?: string;
  variant?: Variant;
};

/**
 * Dropdown of common pronouns with an "Other" option that reveals a free-text
 * field for whatever the patient gives. Posts a single field by `name` so the
 * server action only sees the resolved value.
 */
export function PronounsPicker({
  name = "pronouns",
  defaultValue = "",
  variant = "desktop",
}: Props) {
  const initialChoice: Preset | "other" | "" = !defaultValue
    ? ""
    : isPreset(defaultValue)
      ? defaultValue
      : "other";
  const initialOther = initialChoice === "other" ? defaultValue : "";

  const [choice, setChoice] = useState<Preset | "other" | "">(initialChoice);
  const [other, setOther] = useState(initialOther);

  const submitted = choice === "other" ? other.trim() : choice;

  const selectClass =
    variant === "mobile"
      ? "h-11 w-full cursor-pointer appearance-none rounded-full border border-white/10 bg-white/[0.04] px-4 text-[14px] text-white outline-none focus:border-white/25"
      : "w-full cursor-pointer rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[rgba(246,189,71,0.7)]";

  const inputClass =
    variant === "mobile"
      ? "h-11 w-full cursor-text rounded-full border border-white/10 bg-white/[0.04] px-4 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-white/25"
      : "w-full cursor-text rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]";

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden field carries the resolved value to the server action. */}
      <input type="hidden" name={name} value={submitted} />

      <select
        aria-label="Pronouns"
        value={choice}
        onChange={(e) => {
          const next = e.target.value as Preset | "other" | "";
          setChoice(next);
          if (next !== "other") setOther("");
        }}
        className={selectClass}
        // The native option-list popup respects `color-scheme`. Without this,
        // mobile renders the dropdown with a white background regardless of
        // the dark shell.
        style={
          variant === "mobile" ? { colorScheme: "dark" } : undefined
        }
      >
        <option value="">Pronouns</option>
        {PRESETS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
        <option value="other">Other</option>
      </select>

      {choice === "other" && (
        <input
          aria-label="Other pronouns"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Enter pronouns"
          className={inputClass}
        />
      )}
    </div>
  );
}
