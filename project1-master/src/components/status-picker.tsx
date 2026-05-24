"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  STATUSES,
  STATUS_META,
  isRecipientStatus,
  type RecipientStatus,
} from "@/lib/recipient-status";
import {
  DISCHARGE_TYPES,
  DISCHARGE_LABEL,
  type DischargeType,
} from "@/lib/discharge-types";
import { changeRecipientStatus } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";

type Props = {
  recipientId: string;
  recipientName: string;
  currentStatus: string;
  /** Lock the picker entirely (e.g. status === "deceased"). */
  locked?: boolean;
};

const REQUIRES_CONFIRM: RecipientStatus[] = ["critical", "deceased"];

export function StatusPicker({
  recipientId,
  recipientName,
  currentStatus,
  locked = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Discharge-specific UI state — only shown after the nurse picks "Discharged"
  // from the dropdown. They confirm type + add notes, then we send.
  const [dischargePending, setDischargePending] = useState(false);
  const [dischargeType, setDischargeType] = useState<DischargeType>("general");
  const [nurseInstructions, setNurseInstructions] = useState("");

  const safeCurrent: RecipientStatus = isRecipientStatus(currentStatus)
    ? currentStatus
    : "stable";

  // Portal target — lazy init so SSR sees null and the client picks up
  // document.body on the first render.
  const [portalTarget] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body,
  );

  function submitStatus(
    next: RecipientStatus,
    extras: { dischargeType?: DischargeType; nurseInstructions?: string } = {},
  ) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("recipientId", recipientId);
      fd.set("status", next);
      if (extras.dischargeType) fd.set("dischargeType", extras.dischargeType);
      if (extras.nurseInstructions)
        fd.set("nurseInstructions", extras.nurseInstructions);
      try {
        await changeRecipientStatus(fd);
        router.refresh();
        setDischargePending(false);
        setNurseInstructions("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not change status.");
      }
    });
  }

  function pick(next: RecipientStatus) {
    setOpen(false);
    if (next === safeCurrent) return;

    // Discharged is special — open the discharge planning form instead of
    // submitting immediately, so the nurse can pick a type and add notes.
    if (next === "discharged") {
      setDischargeType("general");
      setNurseInstructions("");
      setDischargePending(true);
      return;
    }

    if (REQUIRES_CONFIRM.includes(next)) {
      const meta = STATUS_META[next];
      const ok = window.confirm(
        `Change ${recipientName}'s status to "${meta.label}"?\n\n${meta.description}\n\nThis will be announced in the care team chat.`,
      );
      if (!ok) return;
    }

    submitStatus(next);
  }

  if (locked) {
    return (
      <div className="flex flex-col gap-1.5">
        <StatusPill status={safeCurrent} />
        <span className="text-[11px] text-[var(--muted)]">
          Chart locked. Status cannot be changed.
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] transition hover:border-[rgba(246,189,71,0.7)] disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <StatusPill
            status={safeCurrent}
            className="!ring-0 !bg-transparent !px-0"
          />
        )}
        <ChevronDown className="size-3.5 text-[var(--muted)]" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-1.5 shadow-2xl"
          >
            {STATUSES.map((s) => {
              const meta = STATUS_META[s];
              const active = s === safeCurrent;
              return (
                <button
                  key={s}
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(s)}
                  className={
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition " +
                    (active
                      ? "bg-[var(--surface-3)]"
                      : "hover:bg-[var(--surface-2)]")
                  }
                >
                  <StatusPill status={s} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[var(--ink)]">
                      {meta.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)] leading-snug">
                      {meta.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Discharge planning form — opens after the nurse picks Discharged.
          Rendered via a portal to document.body so it escapes the picker's
          relative parent (and any ancestor with a transform/filter), keeping
          clicks inside the modal from bubbling up to the surrounding header
          links like "Open chat". */}
      {dischargePending && portalTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[100]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 cursor-default bg-black/30"
              onClick={() => !pending && setDischargePending(false)}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitStatus("discharged", { dischargeType, nurseInstructions });
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-1/2 top-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-2xl"
            >
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold-soft)]">
                Discharge planning
              </div>
              <div className="mb-3 text-[15px] font-semibold text-[var(--ink)]">
                {recipientName}
              </div>
              <p className="mb-3 text-[12px] leading-snug text-[var(--muted)]">
                Pick the kind of discharge so the AI plan reflects what really
                happened. The plan is grounded in the chart notes and recent
                reports — anything you add below is included verbatim.
              </p>

              <label className="mb-3 block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Discharge type
                </span>
                <select
                  value={dischargeType}
                  onChange={(e) =>
                    setDischargeType(e.target.value as DischargeType)
                  }
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[rgba(246,189,71,0.7)]"
                >
                  {DISCHARGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DISCHARGE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mb-4 block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Notes for the plan (optional)
                </span>
                <textarea
                  rows={3}
                  value={nurseInstructions}
                  onChange={(e) => setNurseInstructions(e.target.value)}
                  placeholder="e.g. Discharged 6h after laparoscopic appendectomy. No driving until follow-up. Pain controlled on ibuprofen alone."
                  className="w-full resize-none rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
                />
                <span className="mt-1 block text-[10.5px] text-[var(--muted-2)]">
                  These notes are added to the AI prompt for the discharge care
                  plan.
                </span>
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDischargePending(false)}
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1410] hover:bg-[var(--gold-soft)] disabled:opacity-50"
                >
                  {pending && <Loader2 className="size-3.5 animate-spin" />}
                  Generate plan & discharge
                </button>
              </div>
            </form>
          </div>,
          portalTarget,
        )}

      {error && (
        <div className="mt-2 rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]">
          {error}
        </div>
      )}
    </div>
  );
}
