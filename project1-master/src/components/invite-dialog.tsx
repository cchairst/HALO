"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Copy, Heart, Loader2, Mail, Shield, Stethoscope, UserRound, X } from "lucide-react";
import {
  addFamilyContact,
  createFamilyInvite,
  createServiceInvite,
} from "@/app/actions";
import { cn } from "@/lib/cn";

// Unified invite dialog for the desktop UI. The pre-port repo had two
// separate components (InvitePanel for family, ServiceInviteCard for SPS).
// This collapses them into one modal with a role picker so the new desktop
// surface has a single "Invite" affordance everywhere.
//
// "Nurse" is shown as a disabled option — the action layer only supports
// "family" and "aps" invites today; nurses sign up directly from the
// landing page. Showing it greyed-out makes the supported-vs-not surface
// obvious instead of silently omitting it.

export type InviteDialogRecipient = { id: string; name: string };

type Role = "patient" | "family" | "aps" | "caregiver";

const ROLES: {
  id: Role;
  label: string;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  disabledHint?: string;
}[] = [
  { id: "patient", label: "Patient", detail: "The patient themselves.", Icon: UserRound },
  { id: "family", label: "Family member", detail: "A relative or next of kin.", Icon: Heart },
  {
    id: "aps",
    label: "Social & Protective Services",
    detail: "External agent (PT, OT, social work, etc.).",
    Icon: Shield,
  },
  {
    id: "caregiver",
    label: "Nurse",
    detail: "Nurses sign up from the landing page.",
    Icon: Stethoscope,
    disabled: true,
    disabledHint: "Nurses sign up directly — no invite link needed.",
  },
];

// Thin client wrapper so server components can mount a trigger that opens
// the dialog without flipping their own "use client" boundary.
export function InviteLauncher({
  children,
  className,
  recipients,
  initialRecipientId,
}: {
  children: ReactNode;
  className?: string;
  recipients: InviteDialogRecipient[];
  initialRecipientId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <InviteDialog
        open={open}
        onClose={() => setOpen(false)}
        recipients={recipients}
        initialRecipientId={initialRecipientId}
      />
    </>
  );
}

export function InviteDialog({
  open,
  onClose,
  recipients,
  initialRecipientId,
}: {
  open: boolean;
  onClose: () => void;
  // List of patients the inviter may scope the invite to. When length === 1
  // the picker is hidden. Required because the server action needs a
  // recipientId on every invite.
  recipients: InviteDialogRecipient[];
  initialRecipientId?: string;
}) {
  if (!open) return null;
  // Re-mount the form on each open so transient state (email, generated
  // URL, error) starts clean without needing an effect-driven reset.
  return (
    <InviteDialogShell
      onClose={onClose}
      recipients={recipients}
      initialRecipientId={initialRecipientId}
    />
  );
}

function DialogField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function DialogInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
    />
  );
}

function InviteDialogShell({
  onClose,
  recipients,
  initialRecipientId,
}: {
  onClose: () => void;
  recipients: InviteDialogRecipient[];
  initialRecipientId?: string;
}) {
  const [role, setRole] = useState<Role>("family");
  const [recipientId, setRecipientId] = useState<string>(
    initialRecipientId ?? recipients[0]?.id ?? "",
  );
  const [email, setEmail] = useState("");
  // Family-only fields. When role === "family", the dialog also creates a
  // FamilyContact row on the recipient (merging the per-row Add-contact
  // flow into the invite) before issuing the tokenized invite.
  const [contactName, setContactName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [pending, start] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRecipient = recipients.find((r) => r.id === recipientId);
  const showFamilyFields = role === "family";

  function generate() {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (!recipientId) {
      setError("Pick a patient first.");
      return;
    }
    if (role === "caregiver") return;
    const trimmedContactName = contactName.trim();
    if (role === "family" && !trimmedContactName) {
      setError("Contact name is required.");
      return;
    }

    start(async () => {
      try {
        const patientName = activeRecipient?.name ?? "a patient";

        // For family invites, create the FamilyContact row first so the
        // person shows up on the chart even if they never accept the
        // invite. If the invite call below throws, the contact persists
        // and the nurse can retry from the per-row Invite button.
        if (role === "family") {
          const cfd = new FormData();
          cfd.set("recipientId", recipientId);
          cfd.set("name", trimmedContactName);
          cfd.set("relation", relation.trim());
          cfd.set("email", trimmedEmail);
          cfd.set("phone", phone.trim());
          cfd.set("notes", notes.trim());
          cfd.set("isPrimary", isPrimary ? "1" : "0");
          await addFamilyContact(cfd);
        }

        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("email", trimmedEmail);
        fd.set("origin", window.location.origin);

        let result: { url: string; expiresAt: Date };
        if (role === "aps") {
          fd.set("note", `Service invite for ${patientName}`);
          result = await createServiceInvite(fd);
        } else {
          fd.set("familyKind", role);
          fd.set(
            "note",
            role === "patient"
              ? `Patient self-invite for ${patientName}`
              : `Family invite for ${patientName}${
                  trimmedContactName ? ` (${trimmedContactName})` : ""
                }`,
          );
          result = await createFamilyInvite(fd);
        }
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--ink)]">Invite to care team</h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">
              We&apos;ll generate a tokenized link you can copy or email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-7 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {recipients.length > 1 && (
          <div className="mb-3">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
              For which patient
            </div>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[rgba(246,189,71,0.7)]"
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
            Role
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => {
              const active = r.id === role;
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={r.disabled}
                  title={r.disabled ? r.disabledHint : undefined}
                  onClick={() => !r.disabled && setRole(r.id)}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border p-2.5 text-left transition",
                    r.disabled
                      ? "cursor-not-allowed border-[var(--border)] bg-[var(--surface-2)]/40 opacity-50"
                      : active
                        ? "border-[rgba(246,189,71,0.7)] bg-[var(--gold-bg)]"
                        : "border-[var(--border)] bg-[var(--surface-2)]/70 hover:border-[var(--border-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg border",
                      active && !r.disabled
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--gold-soft)]",
                    )}
                  >
                    <r.Icon className="size-3.5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[12.5px] font-semibold text-[var(--ink)]">{r.label}</span>
                    <span className="text-[11px] leading-snug text-[var(--muted)]">{r.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {showFamilyFields && (
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DialogField label="Contact name *">
              <DialogInput
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Maria Chen"
              />
            </DialogField>
            <DialogField label="Relation">
              <DialogInput
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="Daughter"
              />
            </DialogField>
          </div>
        )}

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DialogField label="Email *">
            <DialogInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
            />
          </DialogField>
          {showFamilyFields && (
            <DialogField label="Phone">
              <DialogInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </DialogField>
          )}
        </div>

        {showFamilyFields && (
          <div className="mb-3 flex flex-col gap-3">
            <DialogField label="Notes (optional)">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Best time to call, decision-making role, etc."
                className="w-full resize-none rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
              />
            </DialogField>
            <label className="flex items-center gap-2 text-[12px] text-[var(--ink-2)]">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="size-3.5 accent-[var(--gold)]"
              />
              Set as primary contact for {activeRecipient?.name ?? "this patient"}
            </label>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {error}
          </div>
        )}

        {inviteUrl ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Invite ready
            </div>
            <code className="break-all rounded bg-[var(--surface-3)] px-2 py-1.5 text-[11px] text-[var(--ink-2)]">
              {inviteUrl}
            </code>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <button
                type="button"
                onClick={copyInvite}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={`mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(
                  `Halo invite${activeRecipient ? ` — ${activeRecipient.name}` : ""}`,
                )}&body=${encodeURIComponent(
                  `You've been invited to join Halo.\n\nAccept the invite (expires in 7 days):\n${inviteUrl}`,
                )}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
              >
                <Mail className="size-3.5" />
                Email it
              </a>
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              Whoever clicks signs in with{" "}
              <span className="font-semibold text-[var(--ink-2)]">{email.trim()}</span>
              {activeRecipient ? <> and joins {activeRecipient.name}&apos;s care team automatically.</> : "."}
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={pending || role === "caregiver"}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-bold disabled:opacity-60"
              style={{ background: "var(--gold)", color: "#1b1712" }}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              Generate invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
