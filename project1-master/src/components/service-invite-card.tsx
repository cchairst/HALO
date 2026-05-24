"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2, Mail, ShieldCheck } from "lucide-react";
import { createServiceInvite } from "@/app/actions";

type Variant = "desktop" | "mobile";

type Props = {
  recipientId: string;
  patientName: string;
  /** Mobile uses the dark-shell palette; desktop uses theme tokens. */
  variant?: Variant;
};

/**
 * Nurse-only card for inviting a Social & Protective Services agent onto a
 * patient's care team. Issues a one-time, email-bound, expiring invite link.
 */
export function ServiceInviteCard({
  recipientId,
  patientName,
  variant = "desktop",
}: Props) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function issue() {
    setError(null);
    setLink(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("email", email.trim());
        fd.set("note", note.trim());
        fd.set("origin", window.location.origin);
        const result = await createServiceInvite(fd);
        setLink(result.url);
        setExpiresAt(new Date(result.expiresAt));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create invite.");
      }
    });
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const mailHref = link
    ? `mailto:${encodeURIComponent(email)}` +
      `?subject=${encodeURIComponent(`Halo invite — ${patientName}`)}` +
      `&body=${encodeURIComponent(
        `You've been invited to ${patientName}'s care team on Halo as a Social & Protective Services agent.\n\nAccept the invite (expires in 7 days):\n${link}`,
      )}`
    : "";

  // Style tokens — desktop uses CSS variables; mobile is hard-coded dark to
  // match the always-dark mobile shell.
  const t =
    variant === "mobile"
      ? {
          heading: "text-white",
          subtle: "text-white/55",
          muted: "text-white/45",
          fieldClass:
            "w-full cursor-text rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-white/25",
          primaryButton:
            "inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
          primaryStyle: { background: "#d4a847", color: "#070707" },
          resultBox:
            "flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3",
          resultHeader:
            "text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/45",
          resultLink:
            "break-all rounded bg-white/[0.05] px-2 py-1.5 text-[11px] text-white/80",
          resultMeta: "text-[11px] text-white/45",
          ghostButton:
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:border-white/25",
          mailButton:
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
          mailStyle: { background: "#d4a847", color: "#070707" },
          shield: "text-[#d4a847]",
          errorBox:
            "rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]",
        }
      : {
          heading: "text-[var(--ink)]",
          subtle: "text-[var(--muted)]",
          muted: "text-[var(--muted)]",
          fieldClass:
            "w-full cursor-text rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]",
          primaryButton:
            "inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50",
          primaryStyle: undefined,
          resultBox:
            "flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3",
          resultHeader:
            "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]",
          resultLink:
            "break-all rounded bg-[var(--surface-3)] px-2 py-1.5 text-[11px] text-[var(--ink-2)]",
          resultMeta: "text-[11px] text-[var(--muted)]",
          ghostButton:
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(246,189,71,0.7)]",
          mailButton:
            "inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]",
          mailStyle: undefined,
          shield: "text-[var(--gold-soft)]",
          errorBox:
            "rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]",
        };

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 text-sm font-semibold ${t.heading}`}>
        <ShieldCheck className={`size-4 ${t.shield}`} />
        Invite a service agent
      </div>
      <p className={`text-[12px] ${t.subtle}`}>
        Sends a one-time invite link tied to that email. The agent signs in
        with that email and lands on {patientName}&apos;s care team.
      </p>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="agent@agency.gov"
        disabled={pending}
        className={t.fieldClass}
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        disabled={pending}
        placeholder="Optional context — what services are you asking them to coordinate?"
        className={`${t.fieldClass} resize-none`}
      />

      <button
        type="button"
        onClick={issue}
        disabled={pending}
        className={t.primaryButton}
        style={t.primaryStyle}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Mail className="size-4" />
        )}
        Generate invite link
      </button>

      {error && <div className={t.errorBox}>{error}</div>}

      {link && (
        <div className={t.resultBox}>
          <div className={t.resultHeader}>Invite ready</div>
          <code className={t.resultLink}>{link}</code>
          {expiresAt && (
            <div className={t.resultMeta}>
              Expires {expiresAt.toLocaleString()}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={copy} className={t.ghostButton}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a href={mailHref} className={t.mailButton} style={t.mailStyle}>
              <Mail className="size-3.5" />
              Email invite
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
