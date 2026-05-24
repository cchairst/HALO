"use client";

import { useState } from "react";
import { Check, Copy, Mail, Sparkles, X } from "lucide-react";

// Surfaces a freshly-minted patient invite link on the chart so the nurse
// can copy or email it without leaving the page. Mounted only when the URL
// contains `?inviteCreated=<token>`. Pure client-side dismiss — refreshing
// the chart without the query param hides it.
export function PatientInviteBanner({
  url,
  email,
  patientName,
}: {
  url: string;
  email: string;
  patientName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  async function copyInvite() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const subject = `Halo invite — your care team for ${patientName}`;
  const body = `You've been invited to join Halo, where your nurse can message you about your care.\n\nAccept the invite (expires in 7 days):\n${url}`;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-[rgba(246,189,71,0.55)] bg-[var(--gold-bg)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-[var(--gold-soft)]">
          <Sparkles className="size-4" />
          PATIENT INVITE READY
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-[var(--muted)] transition hover:text-[var(--ink-2)]"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-[13.5px] text-[var(--ink-2)]">
        Send this link to{" "}
        <span className="font-semibold text-[var(--ink)]">{email}</span>. When
        they sign in with that email, they&apos;re added to{" "}
        <span className="font-semibold text-[var(--ink)]">{patientName}</span>
        &apos;s care team automatically — no extra steps.
      </p>
      <code className="break-all rounded bg-[var(--surface-3)] px-3 py-2 text-[11.5px] text-[var(--ink-2)]">
        {url}
      </code>
      <div className="flex flex-wrap gap-2 pt-0.5">
        <button
          type="button"
          onClick={copyInvite}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] transition hover:border-[rgba(246,189,71,0.7)]"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
        >
          <Mail className="size-3.5" />
          Email it
        </a>
      </div>
      <div className="text-[11px] text-[var(--muted)]">
        Expires in 7 days. You can generate a fresh link from the Care team
        card below if it ever expires.
      </div>
    </div>
  );
}
