"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  BadgeCheck,
  Globe,
  Heart,
  Loader2,
  MapPin,
  Shield,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createPrivyUser } from "@/app/actions";
import { LOCALES, type LocaleCode } from "@/lib/locales";
import type { Role } from "@/lib/session";
import { US_STATES } from "@/lib/us-states";

type FamilyKind = "patient" | "family";

// Strings here are the on-the-wire English defaults. They're overridden by
// `dict` (passed in from the server) when a non-English locale is active.
const FAMILY_KINDS: {
  id: FamilyKind;
  Icon: React.ComponentType<{ className?: string }>;
  labelKey: "iAmThePatient" | "iAmFamily";
  taglineKey: "iAmThePatientTagline" | "iAmFamilyTagline";
}[] = [
  { id: "patient", Icon: UserRound, labelKey: "iAmThePatient", taglineKey: "iAmThePatientTagline" },
  { id: "family", Icon: Heart, labelKey: "iAmFamily", taglineKey: "iAmFamilyTagline" },
];

const ROLES: {
  id: Role;
  Icon: React.ComponentType<{ className?: string }>;
  labelKey: "role_caregiver" | "role_family" | "role_aps";
  taglineKey: "role_caregiverTagline" | "role_familyTagline" | "role_apsTagline";
}[] = [
  { id: "caregiver", Icon: Stethoscope, labelKey: "role_caregiver", taglineKey: "role_caregiverTagline" },
  { id: "family", Icon: Users, labelKey: "role_family", taglineKey: "role_familyTagline" },
  { id: "aps", Icon: Shield, labelKey: "role_aps", taglineKey: "role_apsTagline" },
];

export type OnboardingDict = {
  oneLastStep: string;
  acceptFamilyInvite: string;
  acceptServiceInvite: string;
  tellUsTitle: string;
  tellUsBlurb: string;
  displayName: string;
  displayNamePlaceholder: string;
  yourRole: string;
  iAmA: string;
  patientFamilyQuestion: string;
  iAmThePatient: string;
  iAmThePatientTagline: string;
  iAmFamily: string;
  iAmFamilyTagline: string;
  language: string;
  languageHint: string;
  useDifferentSignIn: string;
  settingUp: string;
  continueToHalo: string;
  errorPickRole: string;
  errorPickFamilyKind: string;
  errorAddName: string;
  errorNoEmail: string;
  errorGeneric: string;
  role_caregiver: string;
  role_caregiverTagline: string;
  role_family: string;
  role_familyTagline: string;
  role_aps: string;
  role_apsTagline: string;
  // HIPAA + provider-verification additions.
  stateLabel: string;
  statePlaceholder: string;
  stateHint: string;
  errorPickState: string;
  npiLabel: string;
  npiPlaceholder: string;
  npiHint: string;
  errorNpiInvalid: string;
};

export function OnboardingForm({
  did,
  dicts,
  inviteToken,
  inviteEmail,
  inviteRole,
  inviteFamilyKind,
  inviteRecipientName,
  inviteRoleForBlurb,
}: {
  did: string;
  /** Onboarding strings for every supported locale. The active dict is
   *  picked from the dropdown's current value, so changing the dropdown
   *  immediately re-renders every label, heading, and tile in the new
   *  language without a server round-trip. */
  dicts: Record<LocaleCode, OnboardingDict>;
  /** When present, locks the role to inviteRole and the email check is enforced server-side. */
  inviteToken?: string;
  inviteEmail?: string;
  inviteRole?: "aps" | "family";
  /** When the nurse explicitly issued the invite for the patient (or for
   *  a family member specifically), the sub-toggle is pre-locked. */
  inviteFamilyKind?: FamilyKind;
  /** Patient name for the invite-acceptance blurb. Null when there's no
   *  pending invite. */
  inviteRecipientName?: string | null;
  /** Role the invite grants — drives the welcome blurb wording. */
  inviteRoleForBlurb?: "family" | "aps" | null;
}) {
  const router = useRouter();
  const { user, ready, authenticated, logout } = usePrivy();
  // When an invite is present the role is forced to whatever the invite
  // specified ("aps" or "family"). Without an invite, the user picks from
  // the self-serve roles (caregiver, family).
  const lockedRole: Role | null = inviteToken
    ? (inviteRole ?? "aps")
    : null;
  const lockedFamilyKind: FamilyKind | null = inviteFamilyKind ?? null;
  const [role, setRole] = useState<Role | null>(lockedRole);
  const [familyKind, setFamilyKind] = useState<FamilyKind | null>(lockedFamilyKind);
  const [name, setName] = useState<string | null>(null);
  // Default to English so a stale halo_locale cookie from a previous
  // session doesn't leave the user staring at someone else's language.
  // Picking from the dropdown switches the active dict in-place.
  const [locale, setLocale] = useState<LocaleCode>("en");
  // U.S. state — required for every role. State law layers privacy rules
  // on top of HIPAA, and the value is also pinned on every signed consent
  // form so the legal record reflects the jurisdiction at signing time.
  const [stateCode, setStateCode] = useState<string>("");
  // NPI — shown + required only when the active role is "caregiver". The
  // server action verifies against NPPES before the User row is created.
  const [npi, setNpi] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dict = dicts[locale];

  // Without an invite, the Service role isn't selectable from the sign-up
  // page; nurses self-serve, family self-serve, agents arrive via invite link.
  // With an invite, only the locked role's tile is shown.
  const visibleRoles = lockedRole
    ? ROLES.filter((r) => r.id === lockedRole)
    : ROLES.filter((r) => r.id !== "aps");

  if (!ready) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Loader2 className="size-4 animate-spin" /> {dict.settingUp}
      </div>
    );
  }
  if (!authenticated || !user) {
    return (
      <div className="text-sm text-[var(--muted)]">
        You&apos;re not signed in. Refresh and try again.
      </div>
    );
  }

  const email = user.email?.address ?? user.google?.email ?? "";
  const suggestedName =
    user.google?.name ?? user.email?.address?.split("@")[0] ?? user.phone?.number ?? "";
  const displayName = name ?? suggestedName;

  function submit() {
    setError(null);
    if (!role) {
      setError(dict.errorPickRole);
      return;
    }
    if (role === "family" && !familyKind) {
      setError(dict.errorPickFamilyKind);
      return;
    }
    if (!displayName.trim()) {
      setError(dict.errorAddName);
      return;
    }
    if (!stateCode) {
      setError(dict.errorPickState);
      return;
    }
    if (role === "caregiver") {
      // Loose client check before the server hits NPPES. The action does the
      // real check (length + Luhn + registry hit) and surfaces a specific
      // error if any part fails.
      const trimmedNpi = npi.replace(/\D/g, "");
      if (trimmedNpi.length !== 10) {
        setError(dict.errorNpiInvalid);
        return;
      }
    }
    if (!email) {
      setError(dict.errorNoEmail);
      return;
    }
    if (
      role === "aps" &&
      inviteEmail &&
      email.toLowerCase() !== inviteEmail.toLowerCase()
    ) {
      setError(
        `This invite was sent to ${inviteEmail}. Sign in with that email to accept it.`,
      );
      return;
    }
    start(async () => {
      try {
        await createPrivyUser({
          did,
          email,
          name: displayName.trim(),
          role,
          familyKind: role === "family" ? familyKind ?? undefined : undefined,
          locale,
          inviteToken,
          state: stateCode,
          npi: role === "caregiver" ? npi.replace(/\D/g, "") : undefined,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : dict.errorGeneric);
      }
    });
  }

  // Heading text. Invite-flow gets a custom blurb naming the patient and
  // role; otherwise the standard "Tell us who you are" copy from the dict.
  // The patient name and role-noun are not currently translated separately
  // (they're substituted into an English template) — good enough for now.
  const headingTitle = inviteToken
    ? inviteRoleForBlurb === "family"
      ? dict.acceptFamilyInvite
      : dict.acceptServiceInvite
    : dict.tellUsTitle;
  const headingBlurb = inviteToken
    ? `You've been invited to join${
        inviteRecipientName ? ` ${inviteRecipientName}'s` : " a"
      } care team as ${
        inviteRoleForBlurb === "family"
          ? "a family member"
          : "a Social & Protective Services agent"
      }.`
    : dict.tellUsBlurb;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[12px] font-medium text-[var(--gold-soft)]">
          {dict.oneLastStep}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--ink)] mt-1">
          {headingTitle}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">{headingBlurb}</p>
      </div>

      <div className="gold-divider" />

      <div>
        <label className="text-[12px] font-medium text-[var(--muted)]">
          {dict.displayName}
        </label>
        <input
          value={displayName}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.displayNamePlaceholder}
          className="mt-1.5 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
        />
      </div>

      <div>
        <div className="mb-2 text-[12px] font-medium text-[var(--muted)]">
          {inviteToken ? dict.yourRole : dict.iAmA}
        </div>
        <div className="flex flex-col gap-2">
          {visibleRoles.map(({ id, Icon, labelKey, taglineKey }) => {
            const active = role === id;
            const locked = Boolean(inviteToken);
            return (
              <button
                key={id}
                type="button"
                onClick={() => !locked && setRole(id)}
                disabled={locked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                  active
                    ? "border-[rgba(246,189,71,0.7)] bg-[var(--gold-bg)]"
                    : "border-[var(--border)] bg-[var(--surface)]/70 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]",
                  locked && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--gold-soft)]",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold text-[var(--ink)]">
                    {dict[labelKey]}
                  </div>
                  <div className="text-[12px] text-[var(--muted)]">
                    {dict[taglineKey]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {role === "family" && (
        <div>
          <div className="mb-2 text-[12px] font-medium text-[var(--muted)]">
            {dict.patientFamilyQuestion}
          </div>
          <div className="flex flex-col gap-2">
            {FAMILY_KINDS.map(({ id, Icon, labelKey, taglineKey }) => {
              const active = familyKind === id;
              const locked = Boolean(lockedFamilyKind);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => !locked && setFamilyKind(id)}
                  disabled={locked && active === false}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                    active
                      ? "border-[rgba(246,189,71,0.7)] bg-[var(--gold-bg)]"
                      : "border-[var(--border)] bg-[var(--surface)]/70 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]",
                    locked && !active && "hidden",
                    locked && active && "cursor-default",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg border",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--gold-soft)]",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold text-[var(--ink)]">
                      {dict[labelKey]}
                    </div>
                    <div className="text-[12px] text-[var(--muted)]">
                      {dict[taglineKey]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="text-[12px] font-medium text-[var(--muted)] flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {dict.stateLabel}
        </label>
        <select
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none focus:border-[rgba(246,189,71,0.7)]"
        >
          <option value="">{dict.statePlaceholder}</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-[var(--muted)]">{dict.stateHint}</p>
      </div>

      {role === "caregiver" && (
        <div>
          <label className="text-[12px] font-medium text-[var(--muted)] flex items-center gap-1.5">
            <BadgeCheck className="size-3.5" />
            {dict.npiLabel}
          </label>
          <input
            value={npi}
            onChange={(e) => setNpi(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            placeholder={dict.npiPlaceholder}
            className="mt-1.5 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.7)]"
          />
          <p className="mt-1 text-[11px] text-[var(--muted)]">{dict.npiHint}</p>
        </div>
      )}

      <div>
        <label className="text-[12px] font-medium text-[var(--muted)] flex items-center gap-1.5">
          <Globe className="size-3.5" />
          {dict.language}
        </label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as LocaleCode)}
          className="mt-1.5 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none focus:border-[rgba(246,189,71,0.7)]"
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native} ({l.label})
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-[var(--muted)]">{dict.languageHint}</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>
          Signed in as <span className="font-semibold text-[var(--ink-2)]">{email || "unknown"}</span>
        </span>
        <button
          type="button"
          onClick={async () => {
            // Logout first so PrivyLoginButton's authenticated-redirect
            // useEffect doesn't immediately bounce us back here on /.
            try {
              await logout();
            } catch {
              // Ignore — still navigate so the user isn't stranded.
            }
            router.push("/");
            router.refresh();
          }}
          className="text-[var(--muted)] underline-offset-2 hover:text-[var(--ink-2)] hover:underline"
        >
          {dict.useDifferentSignIn}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold tracking-tight transition",
          "border border-[rgba(246,189,71,0.48)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] disabled:opacity-50",
        )}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> {dict.settingUp}
          </>
        ) : (
          <>{dict.continueToHalo}</>
        )}
      </button>
    </div>
  );
}
