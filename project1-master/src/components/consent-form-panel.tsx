"use client";

import { useState, useTransition } from "react";
import { ClipboardSignature, FileCheck2, FileX2, Plus, ShieldCheck, X } from "lucide-react";
import {
  createConsentForm,
  declineConsentForm,
  signConsentForm,
} from "@/app/actions";
import {
  CONSENT_FORM_TEMPLATES,
  consentTemplatesForInitiator,
  type ConsentFormType,
} from "@/lib/consent-forms";
import { cn } from "@/lib/cn";

export type ConsentFormRow = {
  id: string;
  formType: ConsentFormType;
  title: string;
  body: string;
  status: "pending" | "signed" | "declined" | "revoked";
  requestedById: string;
  requestedByName: string;
  signerId: string;
  signerName: string;
  signedAt: Date | null;
  signedName: string | null;
  decisionNote: string | null;
  createdAt: Date;
};

export type ConsentFormCounterpart = {
  id: string;
  name: string;
  role: string;
};

function statusLabel(status: ConsentFormRow["status"]) {
  if (status === "pending") return "Awaiting signature";
  if (status === "signed") return "Signed";
  if (status === "declined") return "Declined";
  return "Revoked";
}

function statusTone(status: ConsentFormRow["status"]) {
  if (status === "pending") return "border-[rgba(246,189,71,0.5)] bg-[var(--gold-bg)] text-[var(--gold-soft)]";
  if (status === "signed") return "border-green-500/40 bg-green-500/10 text-green-300";
  if (status === "declined") return "border-red-500/40 bg-red-500/10 text-red-300";
  return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]";
}

function formatStamp(d: Date | string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function ConsentFormPanel({
  threadId,
  currentUserId,
  currentUserRole,
  counterparts,
  forms,
}: {
  threadId: string;
  currentUserId: string;
  currentUserRole: "caregiver" | "family" | "aps";
  /** Other thread members the current user can address a form to. */
  counterparts: ConsentFormCounterpart[];
  forms: ConsentFormRow[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  const myPending = forms.filter(
    (f) => f.status === "pending" && f.signerId === currentUserId,
  );
  const otherPending = forms.filter(
    (f) => f.status === "pending" && f.signerId !== currentUserId,
  );
  const closed = forms.filter((f) => f.status !== "pending");

  // The current user can send/request a form if there's at least one
  // counterpart in the thread. We don't pre-restrict by role here — the
  // server action enforces the rules.
  const canInitiate = counterparts.length > 0;

  const openForm = forms.find((f) => f.id === openFormId) ?? null;

  return (
    <div className="px-3 py-2 md:px-4">
      <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 open:bg-[var(--surface)]">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 list-none">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-[var(--gold-soft)]" />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold tracking-tight text-[var(--ink)]">
                Consent &amp; release forms
              </div>
              <div className="truncate text-[11.5px] text-[var(--muted)]">
                {myPending.length > 0
                  ? `${myPending.length} awaiting your signature`
                  : forms.length === 0
                    ? "No forms in this conversation yet"
                    : `${forms.length} on file`}
              </div>
            </div>
          </div>
          {canInitiate && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPickerOpen(true);
              }}
              className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)]"
            >
              <Plus className="size-3.5 text-[var(--gold-soft)]" />
              {currentUserRole === "caregiver" ? "Send form" : "Request form"}
            </button>
          )}
        </summary>

        <div className="flex flex-col gap-2 px-3.5 pb-3 pt-1">
          {myPending.length === 0 && otherPending.length === 0 && closed.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-[12.5px] text-[var(--muted)]">
              No forms yet. {currentUserRole === "caregiver"
                ? "Tap “Send form” to send a consent or release for the patient or family to sign."
                : "Tap “Request form” to ask the nurse to issue a records release or other authorization."}
            </div>
          )}

          {myPending.map((f) => (
            <FormCard key={f.id} form={f} onOpen={() => setOpenFormId(f.id)} ctaLabel="Review & sign" cta="primary" />
          ))}
          {otherPending.map((f) => (
            <FormCard key={f.id} form={f} onOpen={() => setOpenFormId(f.id)} ctaLabel="View" cta="muted" />
          ))}
          {closed.map((f) => (
            <FormCard key={f.id} form={f} onOpen={() => setOpenFormId(f.id)} ctaLabel="View" cta="muted" />
          ))}
        </div>
      </details>

      {pickerOpen && (
        <FormPicker
          threadId={threadId}
          currentUserRole={currentUserRole}
          counterparts={counterparts}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {openForm && (
        <FormDialog
          form={openForm}
          isSigner={openForm.signerId === currentUserId}
          onClose={() => setOpenFormId(null)}
        />
      )}
    </div>
  );
}

function FormCard({
  form,
  onOpen,
  ctaLabel,
  cta,
}: {
  form: ConsentFormRow;
  onOpen: () => void;
  ctaLabel: string;
  cta: "primary" | "muted";
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--gold-soft)]">
        {form.status === "signed" ? (
          <FileCheck2 className="size-4" />
        ) : form.status === "declined" ? (
          <FileX2 className="size-4" />
        ) : (
          <ClipboardSignature className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-[13.5px] font-semibold tracking-tight text-[var(--ink)]">
            {form.title}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              statusTone(form.status),
            )}
          >
            {statusLabel(form.status)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-[var(--muted)]">
          {form.status === "signed" && form.signedAt
            ? `Signed by ${form.signedName ?? form.signerName} on ${formatStamp(form.signedAt)}`
            : form.status === "declined"
              ? `${form.signerName} declined${form.decisionNote ? ` — ${form.decisionNote}` : ""}`
              : `${form.requestedByName} → ${form.signerName} · ${formatStamp(form.createdAt)}`}
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "inline-flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 text-[12px] font-semibold transition",
          cta === "primary"
            ? "border border-[rgba(246,189,71,0.48)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
            : "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]",
        )}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

function FormPicker({
  threadId,
  currentUserRole,
  counterparts,
  onClose,
}: {
  threadId: string;
  currentUserRole: "caregiver" | "family" | "aps";
  counterparts: ConsentFormCounterpart[];
  onClose: () => void;
}) {
  const [formType, setFormType] = useState<ConsentFormType | "">("");
  const [signerId, setSignerId] = useState<string>(counterparts[0]?.id ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const templates = consentTemplatesForInitiator(currentUserRole);

  function submit() {
    setError(null);
    if (!formType) {
      setError("Pick a form to send.");
      return;
    }
    if (!signerId) {
      setError("Pick who should sign this form.");
      return;
    }
    start(async () => {
      try {
        const fd = new FormData();
        fd.append("threadId", threadId);
        fd.append("signerId", signerId);
        fd.append("formType", formType);
        await createConsentForm(fd);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send form.");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[900] flex items-end justify-center px-3 pb-3 pt-12 sm:items-center sm:p-6"
      style={{ background: "rgba(10,8,4,0.78)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight text-[var(--ink)]">
              {currentUserRole === "caregiver" ? "Send a form to sign" : "Request a form"}
            </h3>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">
              The signer reviews the full text in this chat and signs by typing their name.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-3">
          <label className="text-[12px] font-medium text-[var(--muted)]">Form</label>
          <div className="mt-1.5 flex flex-col gap-2">
            {templates.map((t) => {
              const active = formType === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setFormType(t.type)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition",
                    active
                      ? "border-[rgba(246,189,71,0.7)] bg-[var(--gold-bg)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <span className="text-[13.5px] font-semibold text-[var(--ink)]">{t.title}</span>
                  <span className="text-[11.5px] leading-snug text-[var(--muted)]">{t.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[12px] font-medium text-[var(--muted)]">
            {currentUserRole === "caregiver" ? "Who should sign" : "Who you're asking"}
          </label>
          <select
            value={signerId}
            onChange={(e) => setSignerId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-[14px] text-[var(--ink)] outline-none focus:border-[rgba(246,189,71,0.7)]"
          >
            {counterparts.length === 0 && <option value="">No one else on this thread</option>}
            {counterparts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {formType && (
          <div className="mb-3 max-h-44 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--ink-2)] whitespace-pre-wrap">
            {CONSENT_FORM_TEMPLATES[formType].body}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(246,189,71,0.48)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {pending ? "Sending..." : currentUserRole === "caregiver" ? "Send to sign" : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormDialog({
  form,
  isSigner,
  onClose,
}: {
  form: ConsentFormRow;
  isSigner: boolean;
  onClose: () => void;
}) {
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [mode, setMode] = useState<"view" | "sign" | "decline">(
    isSigner && form.status === "pending" ? "sign" : "view",
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitSign() {
    setError(null);
    if (!agreed) {
      setError("Tick the agreement box to sign.");
      return;
    }
    if (signedName.trim().length < 2) {
      setError("Type your full legal name to sign.");
      return;
    }
    start(async () => {
      try {
        const fd = new FormData();
        fd.append("id", form.id);
        fd.append("signedName", signedName.trim());
        fd.append("agreed", "1");
        await signConsentForm(fd);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not sign.");
      }
    });
  }

  function submitDecline() {
    setError(null);
    start(async () => {
      try {
        const fd = new FormData();
        fd.append("id", form.id);
        if (declineNote.trim()) fd.append("note", declineNote.trim());
        await declineConsentForm(fd);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not decline.");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[900] flex items-end justify-center px-3 pb-3 pt-10 sm:items-center sm:p-6"
      style={{ background: "rgba(10,8,4,0.78)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5 max-h-[88vh]"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight text-[var(--ink)]">
              {form.title}
            </h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
              From {form.requestedByName} · {formatStamp(form.createdAt)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--ink-2)] whitespace-pre-wrap">
          {form.body}
        </div>

        {form.status === "signed" && (
          <div className="mt-3 rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-[12px] text-green-200">
            Signed by <span className="font-semibold">{form.signedName ?? form.signerName}</span> on{" "}
            {form.signedAt ? formatStamp(form.signedAt) : ""}.
          </div>
        )}
        {form.status === "declined" && (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            Declined by {form.signerName}
            {form.decisionNote ? ` — ${form.decisionNote}` : ""}.
          </div>
        )}

        {mode === "sign" && form.status === "pending" && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-start gap-2 text-[12.5px] text-[var(--ink-2)]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-4"
              />
              <span>I have read the form above and agree to its terms. I understand my typed name below is a legally binding electronic signature.</span>
            </label>
            <input
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder="Type your full legal name"
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
            />
          </div>
        )}

        {mode === "decline" && form.status === "pending" && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[var(--muted)]">
              Reason (optional)
            </label>
            <textarea
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              rows={2}
              placeholder="e.g. Need more time to review with my family."
              className="w-full resize-none rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
            />
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {isSigner && form.status === "pending" && mode !== "decline" && (
            <button
              type="button"
              onClick={() => setMode("decline")}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)]"
            >
              Decline
            </button>
          )}
          {isSigner && form.status === "pending" && mode === "decline" && (
            <button
              type="button"
              onClick={submitDecline}
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-500/50 bg-red-500/15 px-4 text-[13px] font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-60"
            >
              {pending ? "Submitting..." : "Confirm decline"}
            </button>
          )}
          {isSigner && form.status === "pending" && mode !== "decline" && (
            <button
              type="button"
              onClick={submitSign}
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(246,189,71,0.48)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {pending ? "Signing..." : "Sign"}
            </button>
          )}
          {!isSigner || form.status !== "pending" || mode === "decline" ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)]"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
