"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Lock, MessageSquare, Shield } from "lucide-react";
import { GlassCard, HaloMark, Pill } from "@/components/glass";
import {
  PrivyLoginButton,
  type PrivyLoginButtonLabels,
} from "@/components/privy-login-button";

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduceMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCE_MOTION_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReduceMotionSnapshot() {
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}
function getReduceMotionServerSnapshot() {
  return false;
}

// Every translatable string the unauthenticated landing page shows. One
// slide per supported locale; the rotator advances through them in order.
// When adding a new visible string to the landing page, add it here and to
// every locale dictionary.
export type LandingSlide = {
  code: string;
  dir: "ltr" | "rtl";
  // Status pill in the header bar (top-right).
  secureBadge: string;
  // Hero headline + subheadline.
  line1: string;
  line2: string;
  subheadline: string;
  // Three feature pills under the hero.
  feature_chats: string;
  feature_reports: string;
  feature_review: string;
  // Sign-in card (right column).
  signInLabel: string;
  welcome: string;
  chooseRole: string;
  signInBlurb: string;
  bullet_emailSms: string;
  bullet_noPasswords: string;
  footer: string;
  signInButton: PrivyLoginButtonLabels;
};

// Length of one cross-fade leg in ms. The full crossover takes 2x this
// (fade out → swap → fade in).
const FADE_MS = 450;

function useRotatingIndex(
  length: number,
  intervalMs: number,
): { index: number; phase: "in" | "out" } {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const reduceMotion = useSyncExternalStore(
    subscribeReduceMotion,
    getReduceMotionSnapshot,
    getReduceMotionServerSnapshot,
  );

  useEffect(() => {
    if (reduceMotion || length <= 1) return;
    let swapTimer: number | undefined;
    const tick = window.setInterval(() => {
      // Fade out, swap the slide while the block is invisible, fade back in.
      // Both legs use the same easing so the transition is symmetric.
      setPhase("out");
      swapTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % length);
        setPhase("in");
      }, FADE_MS);
    }, intervalMs);
    return () => {
      window.clearInterval(tick);
      if (swapTimer !== undefined) window.clearTimeout(swapTimer);
    };
  }, [reduceMotion, length, intervalMs]);

  return { index, phase };
}

// Drives the entire visible chrome of the landing page through every
// supported locale, Apple-marketing-style. The static logo is rendered
// here too so the rotation is fully self-contained — page.tsx provides
// the outer <main> wrapper and (optionally) a demo branch for the sign-in
// card when Privy isn't configured.
export function RotatingLanding({
  slides,
  signInReady,
  demoSignInCard,
  intervalMs = 5000,
}: {
  slides: LandingSlide[];
  /** True when Privy is configured. When false, page.tsx provides a demo
   *  card via `demoSignInCard` to render in place of the Privy sign-in. */
  signInReady: boolean;
  demoSignInCard?: React.ReactNode;
  intervalMs?: number;
}) {
  const { index: i, phase } = useRotatingIndex(slides.length, intervalMs);
  const slide = slides[i] ?? slides[0];
  if (!slide) return null;
  // One wrapper governs the cross-fade — every rotating element inherits
  // the opacity transition. Static elements (Halo logo, lock icon, Privy
  // button chrome) live outside this wrapper so they don't pulse with
  // every tick.
  const fadeStyle: React.CSSProperties = {
    opacity: phase === "in" ? 1 : 0,
    transition: `opacity ${FADE_MS}ms ease-in-out`,
  };

  return (
    <div className="relative w-full max-w-6xl">
      <div className="mb-8 flex items-center justify-between lg:mb-10">
        <div className="flex items-center gap-2.5">
          <HaloMark size={28} />
          <span className="text-base font-semibold tracking-tight text-[var(--ink)]">
            Halo
          </span>
        </div>
        <div
          lang={slide.code}
          dir={slide.dir}
          style={fadeStyle}
          className="flex items-center gap-2 text-[11px] font-medium text-[var(--muted)]"
        >
          <span className="status-dot" />
          <span className="hidden lg:inline">{slide.secureBadge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* Left column: render every slide stacked in the same grid cell
            so the column height equals the tallest slide's height — the
            row stops growing/shrinking with each rotation, which kept
            the right-hand sign-in card bouncing up and down.
            Hidden on mobile — small viewports show only the sign-in card. */}
        <div className="hidden lg:block">
          <RotatingStack
            slides={slides}
            activeIndex={i}
            phase={phase}
            className="w-full"
          >
            {(s) => (
              <div className="flex flex-col gap-5">
                <Pill tone="live" className="self-start">
                  <Lock className="size-3" /> {s.secureBadge}
                </Pill>
                <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--ink)] sm:text-[64px]">
                  {s.line1}
                  <br />
                  <span className="gold-text">{s.line2}</span>
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)]">
                  {s.subheadline}
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Feature icon={<MessageSquare className="size-4" />} label={s.feature_chats} />
                  <Feature icon={<Lock className="size-4" />} label={s.feature_reports} />
                  <Feature icon={<Shield className="size-4" />} label={s.feature_review} />
                </div>
              </div>
            )}
          </RotatingStack>
        </div>

        {signInReady ? (
          /* Right card: same stack treatment so the card body itself
             holds the tallest height across all locales. PrivyLoginButton
             gets rendered once per stacked layer, but only the active
             layer is interactive (pointer-events: none on the rest). */
          <RotatingStack slides={slides} activeIndex={i} phase={phase}>
            {(s) => (
              <GlassCard strong className="p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-[var(--gold-soft)]">
                      {s.signInLabel}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                      {s.welcome}
                    </h2>
                  </div>
                  <div className="grid size-10 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--gold-bg)] text-[var(--gold-soft)]">
                    <Lock className="size-4" />
                  </div>
                </div>

                <div className="gold-divider mb-5" />

                <div className="flex flex-col gap-4">
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {s.signInBlurb}
                  </p>
                  <PrivyLoginButton labels={s.signInButton} />
                  <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--muted)]">
                    <li>- {s.bullet_emailSms}</li>
                    <li>- {s.bullet_noPasswords}</li>
                  </ul>
                </div>

                <div className="mt-5 border-t border-[var(--border)] pt-4 text-[11px] leading-relaxed text-[var(--muted)]">
                  {s.footer}
                </div>
              </GlassCard>
            )}
          </RotatingStack>
        ) : (
          demoSignInCard
        )}
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-[var(--ink-2)]">
      <span className="text-[var(--gold-soft)]">{icon}</span>
      {label}
    </div>
  );
}

// Renders every slide in the same CSS-grid cell so the container's
// intrinsic height equals the tallest slide's height. Only the active
// slide is opaque; the rest are pointer-events: none and aria-hidden so
// screen readers and clicks pass through to the visible one. The result
// is a layout that doesn't reflow during a rotation — the card on the
// right stops bouncing as text length changes between languages.
function RotatingStack({
  slides,
  activeIndex,
  phase,
  className,
  children,
}: {
  slides: LandingSlide[];
  activeIndex: number;
  phase: "in" | "out";
  className?: string;
  children: (slide: LandingSlide) => React.ReactNode;
}) {
  return (
    <div className={`grid w-full min-w-0 grid-cols-1${className ? ` ${className}` : ""}`}>
      {slides.map((slide, i) => {
        const isActive = i === activeIndex;
        const visible = isActive && phase === "in";
        return (
          <div
            key={slide.code}
            lang={slide.code}
            dir={slide.dir}
            aria-hidden={!isActive}
            className="min-w-0"
            style={{
              gridArea: "1 / 1",
              opacity: visible ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {children(slide)}
          </div>
        );
      })}
    </div>
  );
}
