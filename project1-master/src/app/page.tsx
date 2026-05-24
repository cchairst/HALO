import { redirect } from "next/navigation";
import { ArrowRight, Lock, Shield, Stethoscope, Users } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { isDemoMode, ROLE_LABEL, type Role } from "@/lib/session";
import { getCurrentUser } from "@/lib/session";
import { isPrivyConfigured } from "@/lib/privy";
import { pickRole } from "@/app/actions";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { LOCALES, isRtl, type LocaleCode } from "@/lib/locales";
import {
  RotatingLanding,
  type LandingSlide,
} from "@/components/rotating-hero";

export const dynamic = "force-dynamic";

async function setRole(formData: FormData) {
  "use server";
  const role = String(formData.get("role")) as Role;
  await pickRole(role);
}

const ROLES: {
  id: Role;
  short: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "caregiver", short: "Nurse", tagline: "Coordinate care and message patients.", Icon: Stethoscope },
  { id: "family", short: "Patient", tagline: "Message your nurse or care team.", Icon: Users },
  {
    id: "aps",
    short: "Social & Protective Services",
    tagline: "Welfare review and follow-up services for adults and minors.",
    Icon: Shield,
  },
];

type SP = Promise<{ invite?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const { invite: inviteToken } = await searchParams;
  const user = await getCurrentUser();
  // Existing signed-in users normally skip straight to /dashboard, but if
  // they're following a service invite link we send them through onboarding
  // so the invite gets consumed and the patient membership is created.
  if (user) {
    redirect(
      inviteToken
        ? `/onboarding?invite=${encodeURIComponent(inviteToken)}`
        : "/dashboard",
    );
  }

  const signInReady = isPrivyConfigured();
  const demoOn = isDemoMode();
  const activeLocale = await resolveLocale();

  // Build the rotation in every supported locale. The user's last-picked
  // locale leads the order so they don't see Spanish first when they last
  // signed in in English.
  const orderedCodes: LocaleCode[] = [
    activeLocale,
    ...LOCALES.map((l) => l.code).filter((c) => c !== activeLocale),
  ];
  const dicts = await Promise.all(
    orderedCodes.map((c) => getDictionary(c).then((d) => ({ code: c, d }))),
  );
  const slides: LandingSlide[] = dicts.map(({ code, d }) => ({
    code,
    dir: isRtl(code) ? "rtl" : "ltr",
    secureBadge: d.landing.secureBadge,
    line1: d.landing.headlineLine1,
    line2: d.landing.headlineLine2,
    subheadline: d.landing.subheadline,
    feature_chats: d.landing.feature_chats,
    feature_reports: d.landing.feature_reports,
    feature_review: d.landing.feature_review,
    signInLabel: d.landing.signInLabel,
    welcome: d.landing.welcome,
    chooseRole: d.landing.chooseRole,
    signInBlurb: d.landing.signInBlurb,
    bullet_emailSms: d.landing.bullet_emailSms,
    bullet_noPasswords: d.landing.bullet_noPasswords,
    footer: d.landing.footer,
    signInButton: {
      signIn: d.landing.signInButton,
      loading: d.landing.signInLoading,
      redirecting: d.landing.signInRedirecting,
    },
  }));

  // Demo / no-Privy branch: rendered into RotatingLanding via the
  // demoSignInCard slot. Strings on the demo card stay English — the
  // demo path is for builds without Privy and isn't shown to real users.
  const demoSignInCard = !signInReady ? (
    <GlassCard strong className="p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-[var(--gold-soft)]">Sign in</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Choose your role
          </h2>
        </div>
        <div className="grid size-10 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--gold-bg)] text-[var(--gold-soft)]">
          <Lock className="size-4" />
        </div>
      </div>

      <div className="gold-divider mb-5" />

      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Sign-in is not set up on this build.
        </p>
        {demoOn ? (
          <div className="flex flex-col gap-2.5">
            {ROLES.map(({ id, short, tagline, Icon }) => (
              <form key={id} action={setRole}>
                <button
                  type="submit"
                  name="role"
                  value={id}
                  className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] transition group-hover:border-[rgba(246,189,71,0.55)]">
                    <Icon className="size-4.5 text-[var(--gold-soft)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-[var(--ink)]">
                      {short}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--muted)]">
                      {tagline}
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-[var(--muted-2)] transition group-hover:translate-x-0.5 group-hover:text-[var(--gold-soft)]" />
                </button>
              </form>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 text-sm text-[var(--muted)]">
            Sign-in is disabled for this build.
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-[var(--border)] pt-4 text-[11px] leading-relaxed text-[var(--muted)]">
        Your care team controls access to private notes and patient reports.
      </div>
    </GlassCard>
  ) : null;

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-6 sm:py-14">
      <RotatingLanding
        slides={slides}
        signInReady={signInReady}
        demoSignInCard={demoSignInCard}
      />

      {/* Demo "Preview mode" expander stays a static affordance under the
          rotating card — it's only used in dev / preview environments and
          its strings aren't worth rotating. */}
      {signInReady && demoOn && (
        <div className="absolute bottom-4 right-4 max-w-xs">
          <details className="group">
            <summary className="flex cursor-pointer list-none select-none items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink-2)]">
              <ArrowRight className="size-3 transition group-open:rotate-90" />
              Preview mode - skip sign in
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {ROLES.map(({ id, short, Icon }) => (
                <form key={id} action={setRole}>
                  <button
                    type="submit"
                    name="role"
                    value={id}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-left text-[13px] transition hover:bg-[var(--surface)]"
                  >
                    <Icon className="size-3.5 text-[var(--muted)]" />
                    <span className="text-[var(--ink-2)]">{short}</span>
                    <span className="ml-auto text-[10px] text-[var(--muted)]">
                      {ROLE_LABEL[id]}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          </details>
        </div>
      )}
    </main>
  );
}
