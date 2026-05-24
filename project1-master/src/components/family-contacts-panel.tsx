"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import {
  addFamilyContact,
  createFamilyInvite,
  deleteFamilyContact,
  updateFamilyContact,
} from "@/app/actions";

export type FamilyContactRow = {
  id: string;
  name: string;
  relation: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
};

type Variant = "desktop" | "mobile";

type Props = {
  recipientId: string;
  patientName: string;
  contacts: FamilyContactRow[];
  /** True when the viewer is a caregiver and the chart isn't locked. */
  canEdit: boolean;
  variant?: Variant;
};

/**
 * Family contacts (next-of-kin) panel on the patient chart. Nurses can add,
 * edit, delete, mark a primary, and convert a contact to a Halo family
 * account via the invite flow. Read-only for everyone else.
 */
export function FamilyContactsPanel({
  recipientId,
  patientName,
  contacts,
  canEdit,
  variant = "desktop",
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...contacts].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const t = themeFor(variant);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-sm font-semibold ${t.heading}`}>
          <UserCircle2 className={`size-4 ${t.accent}`} />
          Family contacts
          <span className={`text-[11px] font-normal ${t.subtle}`}>
            · {contacts.length}
          </span>
        </div>
        {canEdit && !showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className={t.ghostBtn}
          >
            <Plus className="size-3.5" />
            Add
          </button>
        )}
      </div>

      {sorted.length === 0 && !showAdd && (
        <div className={`rounded-xl px-3 py-3 text-[12px] ${t.empty}`}>
          {canEdit
            ? `No family contacts on ${patientName}'s chart yet. Add the next-of-kin so service agents can coordinate care.`
            : "No family contacts recorded yet."}
        </div>
      )}

      {sorted.map((c) =>
        editing === c.id ? (
          <ContactForm
            key={c.id}
            recipientId={recipientId}
            existing={c}
            onDone={() => setEditing(null)}
            variant={variant}
          />
        ) : (
          <ContactRow
            key={c.id}
            contact={c}
            recipientId={recipientId}
            patientName={patientName}
            canEdit={canEdit}
            variant={variant}
            onEdit={() => setEditing(c.id)}
          />
        ),
      )}

      {canEdit && showAdd && (
        <ContactForm
          recipientId={recipientId}
          onDone={() => setShowAdd(false)}
          variant={variant}
        />
      )}
    </div>
  );
}

function ContactRow({
  contact,
  recipientId,
  patientName,
  canEdit,
  variant,
  onEdit,
}: {
  contact: FamilyContactRow;
  recipientId: string;
  patientName: string;
  canEdit: boolean;
  variant: Variant;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = themeFor(variant);

  function remove() {
    if (
      !window.confirm(
        `Remove ${contact.name} from ${patientName}'s family contacts?`,
      )
    )
      return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", contact.id);
        fd.set("recipientId", recipientId);
        await deleteFamilyContact(fd);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove contact.");
      }
    });
  }

  function issueInvite() {
    if (!contact.email) {
      setError("This contact needs an email before they can get an invite.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("email", contact.email!);
        fd.set("note", `Family invite for ${contact.name}`);
        fd.set("origin", window.location.origin);
        const result = await createFamilyInvite(fd);
        setInviteUrl(result.url);
        setInviteOpen(true);
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
    <div className={t.row}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[14px] font-semibold ${t.heading}`}>
              {contact.name}
            </span>
            {contact.isPrimary && (
              <span className={t.primaryPill}>
                <Star className="size-3" /> Primary
              </span>
            )}
            {contact.relation && (
              <span className={`text-[11px] ${t.subtle}`}>
                · {contact.relation}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className={`inline-flex items-center gap-1.5 text-[12px] ${t.linkRow}`}
              >
                <Mail className="size-3" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className={`inline-flex items-center gap-1.5 text-[12px] ${t.linkRow}`}
              >
                <Phone className="size-3" />
                {contact.phone}
              </a>
            )}
            {contact.notes && (
              <p className={`mt-1 text-[12px] leading-snug ${t.subtle}`}>
                {contact.notes}
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              disabled={pending}
              aria-label="Edit"
              className={t.iconBtn}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label="Remove"
              className={t.iconBtn}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={issueInvite}
            disabled={pending || !contact.email}
            title={
              contact.email
                ? "Send a Halo sign-up link tied to this email"
                : "Add an email first"
            }
            className={t.ghostBtn}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Mail className="size-3.5" />
            )}
            Convert to Halo invite
          </button>
        </div>
      )}

      {error && <div className={t.error}>{error}</div>}

      {inviteOpen && inviteUrl && (
        <div className={t.inviteBox}>
          <div className={t.inviteHeader}>Family invite ready</div>
          <code className={t.inviteLink}>{inviteUrl}</code>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={copyInvite} className={t.ghostBtn}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={`mailto:${encodeURIComponent(contact.email ?? "")}?subject=${encodeURIComponent(`Halo invite — ${patientName}`)}&body=${encodeURIComponent(
                `You've been invited to ${patientName}'s care team on Halo as family.\n\nAccept the invite (expires in 7 days):\n${inviteUrl}`,
              )}`}
              className={t.mailBtn}
            >
              <Mail className="size-3.5" />
              Email it
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactForm({
  recipientId,
  existing,
  onDone,
  variant,
}: {
  recipientId: string;
  existing?: FamilyContactRow;
  onDone: () => void;
  variant: Variant;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(existing?.name ?? "");
  const [relation, setRelation] = useState(existing?.relation ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [isPrimary, setIsPrimary] = useState(existing?.isPrimary ?? false);

  const t = themeFor(variant);

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("name", name.trim());
        fd.set("relation", relation.trim());
        fd.set("email", email.trim());
        fd.set("phone", phone.trim());
        fd.set("notes", notes.trim());
        if (isPrimary) fd.set("isPrimary", "1");
        if (existing) {
          fd.set("id", existing.id);
          await updateFamilyContact(fd);
        } else {
          await addFamilyContact(fd);
        }
        router.refresh();
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save contact.");
      }
    });
  }

  return (
    <div className={t.form}>
      <div className="flex items-center justify-between">
        <div className={`text-[12px] font-semibold uppercase tracking-[0.12em] ${t.subtle}`}>
          {existing ? "Edit contact" : "New contact"}
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label="Cancel"
          className={t.iconBtn}
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={t.field}
        />
        <input
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Relation (daughter, spouse, ...)"
          className={t.field}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className={t.field}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="Phone (for SMS later)"
          className={t.field}
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder='Notes (e.g. "calls Sundays", "Spanish-speaking only")'
        className={`${t.field} resize-none`}
      />

      <label className={`flex cursor-pointer items-center gap-2 text-[12px] ${t.subtle}`}>
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="size-4 cursor-pointer accent-[#d4a847]"
        />
        Mark as primary contact
      </label>

      {error && <div className={t.error}>{error}</div>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
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
          {existing ? "Save changes" : "Save contact"}
        </button>
      </div>
    </div>
  );
}

// --- Theme helpers --------------------------------------------------------

function themeFor(variant: Variant) {
  if (variant === "mobile") {
    return {
      heading: "text-white",
      subtle: "text-white/55",
      accent: "text-[#d4a847]",
      empty:
        "rounded-xl border border-white/10 bg-white/[0.03] text-white/60",
      row:
        "rounded-xl border border-white/10 bg-white/[0.03] p-3",
      form:
        "flex flex-col gap-2 rounded-xl border border-[#d4a847]/40 bg-white/[0.03] p-3",
      field:
        "h-10 w-full cursor-text rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-white/25",
      ghostBtn:
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50",
      iconBtn:
        "inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/14 bg-white/[0.04] text-white/70 hover:border-white/25 disabled:opacity-50",
      primaryBtn:
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50",
      primaryBtnStyle: { background: "#d4a847", color: "#070707" },
      mailBtn:
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
      primaryPill:
        "inline-flex items-center gap-1 rounded-full border border-[#d4a847]/55 bg-[#d4a847]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#d4a847]",
      linkRow:
        "text-white/70 hover:text-white",
      inviteBox:
        "mt-2 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3",
      inviteHeader:
        "text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/45",
      inviteLink:
        "break-all rounded bg-white/[0.05] px-2 py-1.5 text-[11px] text-white/80",
      error:
        "mt-2 rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]",
    } as const;
  }
  return {
    heading: "text-[var(--ink)]",
    subtle: "text-[var(--muted)]",
    accent: "text-[var(--gold-soft)]",
    empty:
      "rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 text-[var(--muted)]",
    row:
      "rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3",
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
    primaryBtnStyle: undefined,
    mailBtn:
      "inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,154,50,0.55)] bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]",
    primaryPill:
      "inline-flex items-center gap-1 rounded-full border border-[rgba(246,189,71,0.55)] bg-[var(--gold-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--gold-soft)]",
    linkRow: "text-[var(--ink-2)] hover:text-[var(--ink)]",
    inviteBox:
      "mt-2 flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3",
    inviteHeader:
      "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]",
    inviteLink:
      "break-all rounded bg-[var(--surface-3)] px-2 py-1.5 text-[11px] text-[var(--ink-2)]",
    error:
      "mt-2 rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#fca5a5]",
  } as const;
}
