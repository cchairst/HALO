"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Heart, Loader2, Mail, UserRound } from "lucide-react";
import { GhostButton } from "@/components/glass";
import { createFamilyInvite } from "@/app/actions";
import { cn } from "@/lib/cn";

type Kind = "patient" | "family";

// Issues a tokenized family-role invite tied to this patient. The previous
// version of this component sent a dumb mailto with no token, so anyone
// clicking the link signed up unattached to a patient — that bug is what
// this component now fixes.
//
// The nurse picks whether the invite is for the patient themselves or for
// a family member. The choice rides on the invite as `familyKind` so the
// patient/family sub-toggle on the invitee's onboarding form is pre-locked
// to whatever the nurse picked.
export function InvitePanel({
  recipientId,
  patientName,
}: {
  recipientId: string;
  patientName?: string;
}) {
  const [kind, setKind] = useState<Kind>("family");
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    start(async () => {
      try {
        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("email", trimmed);
        fd.set("familyKind", kind);
        fd.set("origin", window.location.origin);
        fd.set(
          "note",
          kind === "patient"
            ? `Patient self-invite${patientName ? ` for ${patientName}` : ""}`
            : `Family invite${patientName ? ` for ${patientName}` : ""}`,
        );
        const result = await createFamilyInvite(fd);
        setInviteUrl(result.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create invite.");
      }
    });
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const subject = kind === "patient"
    ? `Halo invite — your care team for ${patientName ?? "you"}`
    : `Halo invite — ${patientName ?? "a patient"}'s care team`;
  const bodyText = inviteUrl
    ? kind === "patient"
      ? `You've been invited to join Halo, where your nurse can message you about your care.\n\nAccept the invite (expires in 7 days):\n${inviteUrl}`
      : `You've been invited to ${patientName ?? "a patient"}'s care team on Halo.\n\nAccept the invite (expires in 7 days):\n${inviteUrl}`
    : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          Who are you inviting?
        </div>
        <div className="grid grid-cols-2 gap-2">
          <KindButton
            id="patient"
            active={kind === "patient"}
            onClick={() => setKind("patient")}
            Icon={UserRound}
            label="The patient"
          />
          <KindButton
            id="family"
            active={kind === "family"}
            onClick={() => setKind("family")}
            Icon={Heart}
            label="A family member"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          type="email"
          className="min-w-0 flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
        />
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(201,154,50,0.48)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold tracking-tight text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Generate invite
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      )}

      {inviteUrl && (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {kind === "patient" ? "Patient invite ready" : "Family invite ready"}
          </div>
          <code className="break-all rounded bg-[var(--surface-3)] px-2 py-1.5 text-[11px] text-[var(--ink-2)]">
            {inviteUrl}
          </code>
          <div className="flex flex-wrap gap-2 pt-0.5">
            <GhostButton type="button" onClick={copyInvite}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </GhostButton>
            <a
              href={`mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
            >
              <Mail className="size-3.5" />
              Email it
            </a>
          </div>
          <div className="text-[11px] text-[var(--muted)]">
            Whoever clicks this link signs in with{" "}
            <span className="font-semibold text-[var(--ink-2)]">{email.trim()}</span>
            {" "}and is added to {patientName ?? "this patient"}&apos;s care team automatically.
          </div>
        </div>
      )}
    </div>
  );
}

function KindButton({
  active,
  onClick,
  Icon,
  label,
}: {
  id: Kind;
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition",
        active
          ? "border-[rgba(246,189,71,0.7)] bg-[var(--gold-bg)] text-[var(--ink)]"
          : "border-[var(--border)] bg-[var(--surface)]/70 text-[var(--ink-2)] hover:border-[var(--border-strong)]",
      )}
    >
      <span
        className={cn(
          "grid size-7 place-items-center rounded-lg border",
          active
            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--gold-soft)]",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      {label}
    </button>
  );
}
