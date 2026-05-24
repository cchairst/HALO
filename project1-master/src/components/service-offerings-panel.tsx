"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Check,
  ClipboardList,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createServiceOffering,
  decideServiceOffering,
  type CreateServiceOfferingResult,
} from "@/app/actions";
import {
  isServiceType,
  OFFERING_STATUS_LABEL,
  SERVICE_LABEL,
  SERVICE_TYPES,
  type OfferingStatus,
  type ServiceType,
} from "@/lib/service-types";

export type ServiceOfferingRow = {
  id: string;
  serviceType: string;
  frequency: string | null;
  startDate: Date | null;
  durationWeeks: number | null;
  notes: string | null;
  status: string;
  proposedByName: string;
  proposedByIsCurrentUser: boolean;
  decidedByName: string | null;
  decisionNote: string | null;
  createdAt: Date;
};

type Variant = "desktop" | "mobile";

type Props = {
  recipientId: string;
  patientName: string;
  /** Patient status — agents can only propose once status hits ready_for_discharge. */
  recipientStatus: string;
  offerings: ServiceOfferingRow[];
  /** Current user's role — determines which buttons appear. */
  viewerRole: "caregiver" | "family" | "aps" | string;
  variant?: Variant;
};

export function ServiceOfferingsPanel({
  recipientId,
  patientName,
  recipientStatus,
  offerings,
  viewerRole,
  variant = "desktop",
}: Props) {
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<CreateServiceOfferingResult | null>(null);
  const t = themeFor(variant);
  const isAgent = viewerRole === "aps";
  const canDecide = viewerRole === "caregiver" || viewerRole === "family";
  const proposalsOpen =
    recipientStatus === "ready_for_discharge" ||
    recipientStatus === "discharged";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-sm font-semibold ${t.heading}`}>
          <ClipboardList className={`size-4 ${t.accent}`} />
          Service offerings
          <span className={`text-[11px] font-normal ${t.subtle}`}>
            · {offerings.length}
          </span>
        </div>
        {isAgent && !creating && proposalsOpen && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setResult(null);
            }}
            className={t.ghostBtn}
          >
            <Plus className="size-3.5" />
            Propose service
          </button>
        )}
      </div>

      {isAgent && !proposalsOpen && (
        <div className={`rounded-xl px-3 py-3 text-[12px] ${t.empty}`}>
          Service proposals open once the nurse marks {patientName} as
          {" "}
          <span className="font-semibold">Ready for discharge</span>
          . Until then, you can review the chart and reports.
        </div>
      )}

      {result && <BroadcastBanner result={result} variant={variant} onDismiss={() => setResult(null)} />}

      {!creating && offerings.length === 0 && proposalsOpen && (
        <div className={`rounded-xl px-3 py-3 text-[12px] ${t.empty}`}>
          {isAgent
            ? `No services proposed for ${patientName} yet. Pick one to send to the family.`
            : `No service offerings on file yet for ${patientName}.`}
        </div>
      )}

      {isAgent && creating && proposalsOpen && (
        <OfferingForm
          recipientId={recipientId}
          variant={variant}
          onDone={(r) => {
            setCreating(false);
            if (r) setResult(r);
          }}
        />
      )}

      {offerings.map((o) => (
        <OfferingRow
          key={o.id}
          offering={o}
          recipientId={recipientId}
          canDecide={canDecide}
          isProposer={o.proposedByIsCurrentUser}
          variant={variant}
        />
      ))}
    </div>
  );
}

function OfferingRow({
  offering,
  recipientId,
  canDecide,
  isProposer,
  variant,
}: {
  offering: ServiceOfferingRow;
  recipientId: string;
  canDecide: boolean;
  isProposer: boolean;
  variant: Variant;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = themeFor(variant);

  const status = offering.status as OfferingStatus;
  const isOpen = status === "proposed";

  function decide(decision: OfferingStatus) {
    setError(null);
    let note = "";
    if (decision === "declined") {
      const reason = window.prompt(
        "Optional: tell the agent why this is being declined.",
      );
      if (reason === null) return; // user cancelled the prompt
      note = reason.trim();
    } else if (decision === "withdrawn") {
      if (
        !window.confirm("Withdraw this offering? Family will see it as withdrawn.")
      )
        return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", offering.id);
        fd.set("recipientId", recipientId);
        fd.set("decision", decision);
        fd.set("note", note);
        await decideServiceOffering(fd);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update offering.");
      }
    });
  }

  const stType = isServiceType(offering.serviceType)
    ? (offering.serviceType as ServiceType)
    : null;
  const title = stType ? SERVICE_LABEL[stType] : offering.serviceType;

  return (
    <div className={t.row}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[14px] font-semibold ${t.heading}`}>
              {title}
            </span>
            <span className={statusPillClass(status, t)}>
              {OFFERING_STATUS_LABEL[status] ?? offering.status}
            </span>
          </div>
          <div className={`mt-1 text-[12px] ${t.subtle}`}>
            {[
              offering.frequency,
              offering.startDate
                ? `starting ${formatDate(offering.startDate)}`
                : null,
              offering.durationWeeks
                ? `${offering.durationWeeks} wk${
                    offering.durationWeeks === 1 ? "" : "s"
                  }`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "No schedule"}
          </div>
          <div className={`mt-1 text-[11.5px] ${t.subtle}`}>
            Proposed by {offering.proposedByName} ·{" "}
            {formatDate(offering.createdAt)}
          </div>
          {offering.notes && (
            <p className={`mt-1.5 text-[12.5px] leading-snug ${t.body}`}>
              {offering.notes}
            </p>
          )}
          {offering.decidedByName && offering.decisionNote && (
            <p className={`mt-1.5 text-[12px] italic ${t.subtle}`}>
              {offering.decidedByName}: &quot;{offering.decisionNote}&quot;
            </p>
          )}
        </div>
      </div>

      {error && <div className={t.error}>{error}</div>}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canDecide && isOpen && (
          <>
            <button
              type="button"
              onClick={() => decide("accepted")}
              disabled={pending}
              className={t.primaryBtn}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Accept
            </button>
            <button
              type="button"
              onClick={() => decide("declined")}
              disabled={pending}
              className={t.ghostBtn}
            >
              <X className="size-3.5" />
              Decline
            </button>
            <Link
              href="/messages"
              className={`${t.ghostBtn} no-underline`}
            >
              <MessageSquare className="size-3.5" />
              Talk to nurse
            </Link>
          </>
        )}
        {canDecide && status === "accepted" && (
          <button
            type="button"
            onClick={() => decide("completed")}
            disabled={pending}
            className={t.ghostBtn}
          >
            <Check className="size-3.5" />
            Mark completed
          </button>
        )}
        {isProposer && isOpen && (
          <button
            type="button"
            onClick={() => decide("withdrawn")}
            disabled={pending}
            className={t.ghostBtn}
          >
            <Trash2 className="size-3.5" />
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}

function OfferingForm({
  recipientId,
  variant,
  onDone,
}: {
  recipientId: string;
  variant: Variant;
  /** Receives the broadcast summary on success so the parent can render it. */
  onDone: (result: CreateServiceOfferingResult | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("physical_therapy");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [notes, setNotes] = useState("");
  const t = themeFor(variant);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("serviceType", serviceType);
        fd.set("frequency", frequency.trim());
        fd.set("startDate", startDate);
        fd.set("durationWeeks", durationWeeks);
        fd.set("notes", notes.trim());
        const result = await createServiceOffering(fd);
        // Action revalidates the chart page itself; tell the parent to
        // close the form and surface the broadcast banner. No router.refresh()
        // here — that double-fetch was racing the action's revalidate and
        // surfacing as a confusing client error after a successful save.
        onDone(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save offering.");
      }
    });
  }

  return (
    <div className={t.form}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] ${t.subtle}`}>
          <Activity className="size-3.5" />
          New service offering
        </div>
        <button
          type="button"
          onClick={() => onDone(null)}
          aria-label="Cancel"
          className={t.iconBtn}
        >
          <X className="size-3.5" />
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${t.subtle}`}>
          Service
        </span>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value as ServiceType)}
          className={t.field}
          style={variant === "mobile" ? { colorScheme: "dark" } : undefined}
        >
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${t.subtle}`}>
            Frequency
          </span>
          <input
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="2x/week, daily, as needed..."
            className={t.field}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${t.subtle}`}>
            Duration (weeks)
          </span>
          <input
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="6"
            className={t.field}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${t.subtle}`}>
          Start date
        </span>
        <input
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          type="date"
          className={t.field}
          style={variant === "mobile" ? { colorScheme: "dark" } : undefined}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${t.subtle}`}>
          Notes for the family
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder='e.g. "Mobile PT can come to the home on Tuesdays. We will follow up with scheduling."'
          className={`${t.field} resize-none`}
        />
      </label>

      {error && <div className={t.error}>{error}</div>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onDone(null)}
          disabled={pending}
          className={t.ghostBtn}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={t.primaryBtn}
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Send proposal
        </button>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d));
}

function BroadcastBanner({
  result,
  variant,
  onDismiss,
}: {
  result: CreateServiceOfferingResult;
  variant: Variant;
  onDismiss: () => void;
}) {
  const t = themeFor(variant);
  const lines: string[] = [];

  // Three branches based on candidates vs successes:
  //   - 0 candidates: nothing to send (no nurse/family Halo accounts on team).
  //   - some candidates, all failed: send error path; tell the user to look at logs.
  //   - some succeeded: list them; flag any partial failures.
  if (result.chatCandidateCount === 0) {
    lines.push(
      "No nurse or family Halo accounts on this care team — chat broadcast was skipped. (Family contacts on the chart are records only; they need to accept a Halo invite to receive chats.)",
    );
  } else if (result.chatRecipients.length === 0) {
    lines.push(
      `Tried to send to ${result.chatCandidateCount} Halo account(s) but every send failed — check the server logs for the underlying error.`,
    );
  } else {
    const names = result.chatRecipients.map((r) => r.name).join(", ");
    lines.push(`Sent in chat to ${names}.`);
    if (result.chatFailureCount > 0) {
      lines.push(
        `${result.chatFailureCount} send(s) failed — server logs have the cause.`,
      );
    }
  }

  switch (result.emailStatus) {
    case "sent":
      lines.push(`Emailed primary contact: ${result.primaryContactEmail}.`);
      break;
    case "skipped_no_config":
      lines.push(
        "Email skipped — RESEND_API_KEY / RESEND_FROM are not set on the server.",
      );
      break;
    case "skipped_no_primary":
      lines.push(
        "No primary family contact on file. Mark a contact as Primary to enable email broadcast.",
      );
      break;
    case "skipped_no_email":
      lines.push("Primary contact has no email on file.");
      break;
    case "send_failed":
      lines.push(
        "Email send failed — check the server logs for the Resend error.",
      );
      break;
  }

  // Warn tone if nothing actually landed; ok tone if at least one path worked.
  const noChatLanded = result.chatRecipients.length === 0;
  const noEmailLanded = result.emailStatus !== "sent";
  const tone = noChatLanded && noEmailLanded ? t.bannerWarn : t.bannerOk;

  return (
    <div className={tone}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 text-[12px] leading-snug">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={t.iconBtn}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function statusPillClass(
  status: OfferingStatus,
  t: ReturnType<typeof themeFor>,
): string {
  if (status === "accepted") return t.pillAccepted;
  if (status === "declined" || status === "withdrawn") return t.pillDeclined;
  if (status === "completed") return t.pillCompleted;
  return t.pillProposed;
}

function themeFor(variant: Variant) {
  if (variant === "mobile") {
    return {
      heading: "text-white",
      subtle: "text-white/55",
      body: "text-white/85",
      accent: "text-[#d4a847]",
      empty:
        "rounded-xl border border-white/10 bg-white/[0.03] text-white/60",
      row: "rounded-xl border border-white/10 bg-white/[0.03] p-3",
      form:
        "flex flex-col gap-2 rounded-xl border border-[#d4a847]/40 bg-white/[0.03] p-3",
      field:
        "h-10 w-full cursor-text rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-white/25",
      ghostBtn:
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50",
      iconBtn:
        "inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/14 bg-white/[0.04] text-white/70 hover:border-white/25 disabled:opacity-50",
      primaryBtn:
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#d4a847] px-3 py-1.5 text-[12px] font-semibold text-[#070707] hover:bg-[#e0b957] disabled:cursor-not-allowed disabled:opacity-50",
      pillProposed:
        "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/75",
      pillAccepted:
        "inline-flex items-center gap-1 rounded-full border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#86efac]",
      pillDeclined:
        "inline-flex items-center gap-1 rounded-full border border-[rgba(148,163,184,0.4)] bg-[rgba(148,163,184,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#cbd5e1]",
      pillCompleted:
        "inline-flex items-center gap-1 rounded-full border border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#93c5fd]",
      bannerOk:
        "rounded-xl border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.08)] px-3 py-2 text-[#a7f3d0]",
      bannerWarn:
        "rounded-xl border border-[rgba(212,168,71,0.4)] bg-[rgba(212,168,71,0.08)] px-3 py-2 text-[#fde68a]",
      error:
        "mt-2 rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]",
    } as const;
  }
  return {
    heading: "text-[var(--ink)]",
    subtle: "text-[var(--muted)]",
    body: "text-[var(--ink-2)]",
    accent: "text-[var(--gold-soft)]",
    empty:
      "rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 text-[var(--muted)]",
    row: "rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3",
    form:
      "flex flex-col gap-2 rounded-xl border border-[rgba(246,189,71,0.55)] bg-[var(--surface)]/80 p-3",
    field:
      "w-full cursor-text rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]",
    ghostBtn:
      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(246,189,71,0.7)] disabled:cursor-not-allowed disabled:opacity-50",
    iconBtn:
      "inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[rgba(246,189,71,0.7)] disabled:opacity-50",
    primaryBtn:
      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50",
    pillProposed:
      "inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]",
    pillAccepted:
      "inline-flex items-center gap-1 rounded-full border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#16a34a]",
    pillDeclined:
      "inline-flex items-center gap-1 rounded-full border border-[rgba(148,163,184,0.4)] bg-[rgba(148,163,184,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#475569]",
    pillCompleted:
      "inline-flex items-center gap-1 rounded-full border border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1d4ed8]",
    bannerOk:
      "rounded-xl border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.08)] px-3 py-2 text-[#15803d]",
    bannerWarn:
      "rounded-xl border border-[rgba(246,189,71,0.55)] bg-[var(--gold-bg)] px-3 py-2 text-[var(--ink-2)]",
    error:
      "mt-2 rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]",
  } as const;
}
