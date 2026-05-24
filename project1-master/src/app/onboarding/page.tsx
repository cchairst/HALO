import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GlassCard, HaloMark } from "@/components/glass";
import { OnboardingExit } from "@/components/onboarding-exit";
import { OnboardingForm, type OnboardingDict } from "@/components/onboarding-form";
import { getPrivyDid, isPrivyConfigured } from "@/lib/privy";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { LOCALES, type LocaleCode } from "@/lib/locales";

export const dynamic = "force-dynamic";

type SP = Promise<{ invite?: string }>;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  if (!isPrivyConfigured()) redirect("/");

  const { invite: inviteToken } = await searchParams;

  const did = await getPrivyDid();
  if (!did) {
    // Carry the invite token through the sign-in bounce so the user lands
    // back on this page with the same query after authenticating.
    redirect(
      inviteToken
        ? `/?invite=${encodeURIComponent(inviteToken)}`
        : "/",
    );
  }

  const existing = await db.user.findUnique({ where: { privyDid: did } });
  // Existing users with an invite token still need to flow through the
  // accept-invite UI so we can consume the invite and attach them to the
  // patient. Only redirect to /dashboard if there's no pending invite.
  if (existing && !inviteToken) redirect("/dashboard");

  // Look up the invite (if present) to pre-validate before showing the form.
  // The action will re-validate at submit; this is just for UX (lock the role
  // tile and show the patient's name).
  const invite = inviteToken
    ? await db.serviceInvite.findUnique({
        where: { token: inviteToken },
        include: { recipient: { select: { name: true } } },
      })
    : null;
  const inviteValid = Boolean(
    invite && !invite.consumedAt && invite.expiresAt > new Date(),
  );

  // Load the onboarding dict for every supported locale and pass them down.
  // The form picks which one is active from the dropdown's current value
  // and renders ALL its locale-dependent text from `dicts[active]`, so
  // changing the dropdown switches the headings, role tiles, and field
  // labels in lockstep — no cookie write or page reload required.
  const dicts: Record<LocaleCode, OnboardingDict> = Object.fromEntries(
    await Promise.all(
      LOCALES.map(async (l) => [l.code, (await getDictionary(l.code)).onboarding] as const),
    ),
  ) as Record<LocaleCode, OnboardingDict>;

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Top bar: back-to-landing affordance on the left, clickable Halo
            wordmark in the center. Both abandon the in-progress sign-up
            (Privy logout + push to /) so the user can switch emails or
            cancel entirely without being stuck on this screen. */}
        <div className="relative mb-6 flex items-center justify-center">
          <OnboardingExit
            ariaLabel="Cancel sign-up and return to start"
            className="absolute left-0 inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--muted)] transition hover:border-[rgba(246,189,71,0.7)] hover:text-[var(--ink-2)]"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </OnboardingExit>
          <OnboardingExit
            ariaLabel="Cancel sign-up and return to start"
            className="inline-flex items-center gap-2.5 rounded-full px-2 py-1 transition hover:bg-[var(--surface)]"
          >
            <HaloMark size={28} />
            <span className="text-base font-semibold tracking-tight text-[var(--ink)]">
              Halo
            </span>
          </OnboardingExit>
        </div>

        <GlassCard strong className="p-4 sm:p-5 flex flex-col gap-5">
          <OnboardingForm
            did={did}
            dicts={dicts}
            inviteToken={inviteValid ? inviteToken : undefined}
            inviteEmail={inviteValid ? invite?.email ?? undefined : undefined}
            inviteRole={
              inviteValid && (invite?.role === "family" || invite?.role === "aps")
                ? invite.role
                : undefined
            }
            inviteFamilyKind={
              inviteValid &&
              invite?.role === "family" &&
              (invite?.familyKind === "patient" || invite?.familyKind === "family")
                ? invite.familyKind
                : undefined
            }
            inviteRecipientName={
              inviteValid ? invite?.recipient?.name ?? null : null
            }
            inviteRoleForBlurb={
              inviteValid && (invite?.role === "family" || invite?.role === "aps")
                ? invite.role
                : null
            }
          />

          <div className="text-[11px] text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-4">
            {inviteValid
              ? "Sign in with the email address the nurse invited. The invite expires in 7 days."
              : "Nurses self-register. Family join when a nurse invites them to a patient's care team. Service & Protective Services sign-up is invite-only — ask a nurse on the care team for a link."}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
