"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { updateRecipientChart } from "@/app/actions";

type Props = {
  recipientId: string;
  notes: string | null;
  /** When false, render read-only text only (e.g. for non-nurse roles). */
  canEdit?: boolean;
  /** Mobile detail uses inverted colors; desktop uses the chart palette. */
  variant?: "desktop" | "mobile";
};

export function EditableCareNotes({
  recipientId,
  notes,
  canEdit = true,
  variant = "desktop",
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const empty = !notes || notes.trim().length === 0;

  function save() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("recipientId", recipientId);
      fd.set("notes", draft);
      try {
        await updateRecipientChart(fd);
        router.refresh();
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save notes.");
      }
    });
  }

  if (!canEdit) {
    if (variant === "mobile") {
      return (
        <p
          className="text-[13px] leading-[1.5]"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          {empty ? "No notes added yet." : notes}
        </p>
      );
    }
    return (
      <p className="text-sm leading-6 text-[var(--ink-2)]">
        {empty ? "No notes added yet." : notes}
      </p>
    );
  }

  if (!editing) {
    if (variant === "mobile") {
      return (
        <div className="flex flex-col gap-2">
          <p
            className="text-[13px] leading-[1.5]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {empty ? "No notes added yet." : notes}
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(notes ?? "");
              setEditing(true);
            }}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              border: "0.5px solid rgba(255,255,255,0.14)",
            }}
          >
            <Pencil className="size-3" />
            {empty ? "Add notes" : "Edit notes"}
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-[var(--ink-2)]">
          {empty ? "No notes added yet." : notes}
        </p>
        <button
          type="button"
          onClick={() => {
            setDraft(notes ?? "");
            setEditing(true);
          }}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] transition hover:border-[rgba(246,189,71,0.7)]"
        >
          <Pencil className="size-3.5" />
          {empty ? "Add notes" : "Edit notes"}
        </button>
      </div>
    );
  }

  // editing
  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Care notes, risks, preferences"
          className="w-full cursor-text resize-none rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] leading-5 text-white outline-none placeholder:text-white/35 focus:border-white/25"
        />
        {error && (
          <div className="rounded-lg px-2.5 py-1.5 text-[11px] text-[#fca5a5]">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setDraft(notes ?? "");
              setError(null);
            }}
            className="cursor-pointer rounded-full px-3 py-1 text-[12px] font-semibold disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              border: "0.5px solid rgba(255,255,255,0.14)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold disabled:opacity-50"
            style={{ background: "#fff", color: "#000" }}
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            Save notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        placeholder="Care notes, risks, preferences"
        className="w-full cursor-text resize-none rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
      />
      {error && (
        <div className="rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setEditing(false);
            setDraft(notes ?? "");
            setError(null);
          }}
          className="cursor-pointer rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--gold)] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1410] hover:bg-[var(--gold-soft)] disabled:opacity-50"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Save notes
        </button>
      </div>
    </div>
  );
}
