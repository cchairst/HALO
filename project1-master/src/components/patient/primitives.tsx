import { cn } from "@/lib/cn";
import * as React from "react";

// ---------------------------------------------------------------------------
// Patient mobile primitives.
// Calm, consumer-grade recovery-companion UI. Designed for mobile widths only.
// All colors come from the .patient-mobile scoped tokens in globals.css.
// ---------------------------------------------------------------------------

export function PatientShell({
  children,
  className,
  scrollable = true,
}: {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <div
      className={cn(
        "patient-mobile md:hidden",
        scrollable && "min-h-[100dvh] pb-[140px]",
        className,
      )}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </div>
  );
}

export function HaloLogo({ size = 28 }: { size?: number }) {
  // A two-tone gold halo. Stays gold in both light + dark mode — the only
  // place gold is used liberally in the patient app.
  return (
    <span
      aria-hidden
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="halo-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0" stopColor="#f0c668" />
            <stop offset="1" stopColor="#b6802a" />
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="12.2"
          stroke="url(#halo-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="60 18"
          transform="rotate(-30 16 16)"
        />
      </svg>
    </span>
  );
}

export function HaloHeader({
  back,
  centerLogo = false,
  initials,
  rightSlot,
}: {
  back?: { href: string; label?: string };
  centerLogo?: boolean;
  initials?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="relative flex items-center gap-3 px-5 pt-4 pb-2">
      {back && (
        <BackButton href={back.href} label={back.label} />
      )}

      <div
        className={cn(
          "flex items-center gap-2",
          centerLogo
            ? "absolute left-1/2 -translate-x-1/2"
            : back
              ? "absolute left-1/2 -translate-x-1/2"
              : "",
        )}
      >
        <HaloLogo size={26} />
        <span
          className="text-[22px] font-semibold tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          Halo
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {rightSlot}
        {initials !== undefined && <AvatarChip initials={initials} />}
      </div>
    </header>
  );
}

export function BackButton({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      aria-label={label ?? "Back"}
      className="grid h-9 w-9 place-items-center rounded-full"
      style={{
        background: "var(--p-surface)",
        border: "1px solid var(--p-border)",
        color: "var(--p-ink)",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </a>
  );
}

export function AvatarChip({
  initials,
  size = 36,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <span
      className="inline-grid place-items-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: "var(--p-surface-2)",
        border: "1px solid var(--p-border)",
        color: "var(--p-ink)",
        fontSize: size <= 32 ? 12 : 13,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </span>
  );
}

// Soft sun + rolling hills illustration tucked into the top-right corner of
// the patient home / assistant screens. Greens shift with dark mode so the
// hills don't look navy.
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-0 top-0 -z-0",
        className,
      )}
      style={{ width: 260, height: 200 }}
    >
      <svg
        viewBox="0 0 260 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sun */}
        <circle cx="200" cy="78" r="28" fill="#e8b04a" />
        {/* Far hill */}
        <path
          d="M0 175 Q 80 130 160 150 T 280 145 L 280 220 L 0 220 Z"
          fill="var(--p-hill-1, #d9e5cf)"
          style={{ ["--p-hill-1" as never]: "var(--p-hill-1-c)" }}
        />
        {/* Near hill */}
        <path
          d="M0 195 Q 100 155 200 175 T 280 175 L 280 220 L 0 220 Z"
          fill="var(--p-hill-2, #b9d09f)"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress ring — used on the home screen for "62% recovery progress".
// Renders a soft track + a partial green arc.
// ---------------------------------------------------------------------------

export function ProgressRing({
  value,
  size = 120,
  stroke = 9,
  label,
  sublabel,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--p-green-ring)"
          strokeWidth={stroke}
          fill="none"
          opacity={0.35}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--p-green-bright)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="leading-none">{label}</div>
          {sublabel && (
            <div
              className="mt-1 text-[11.5px]"
              style={{ color: "var(--p-muted)" }}
            >
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon badges — colored circular chips for task / metric rows
// ---------------------------------------------------------------------------

type Tone = "green" | "purple" | "blue" | "red" | "orange" | "gold" | "neutral";

const TONE_BG: Record<Tone, string> = {
  green: "var(--p-green-bg-2)",
  purple: "var(--p-purple-bg)",
  blue: "var(--p-blue-bg)",
  red: "var(--p-red-bg)",
  orange: "var(--p-orange-bg)",
  gold: "var(--p-warn-bg)",
  neutral: "var(--p-surface-2)",
};

const TONE_FG: Record<Tone, string> = {
  green: "var(--p-green-bright)",
  purple: "var(--p-purple)",
  blue: "var(--p-blue)",
  red: "var(--p-red)",
  orange: "var(--p-orange)",
  gold: "var(--p-warn)",
  neutral: "var(--p-muted)",
};

export function IconBadge({
  tone = "neutral",
  size = 40,
  children,
}: {
  tone?: Tone;
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: TONE_BG[tone],
        color: TONE_FG[tone],
      }}
    >
      {children}
    </span>
  );
}

// Small inline SVG icons used across patient screens
export const I = {
  walk: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" />
      <path d="M11 21l1-7-3-1.5L7 16" />
      <path d="M12 14l3 2 3-1" />
      <path d="M10 9.5l-3 2" />
    </svg>
  ),
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  pill: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5a7 7 0 0 1-9.9-9.9l9.9-9.9a7 7 0 0 1 9.9 9.9z" />
      <path d="M8.5 8.5l7 7" />
    </svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  moon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  sparkle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.6 4.6L18 9.2l-4.4 1.6L12 15.4l-1.6-4.6L6 9.2l4.4-1.6z" />
      <path d="M19 14l.7 1.8L21.5 16.5l-1.8.7L19 19l-.7-1.8L16.5 16.5l1.8-.7z" />
    </svg>
  ),
  steps: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17h4l1-3 2 6 3-10 2 5h6" />
    </svg>
  ),
  drop: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
  trend: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  ),
  chevron: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  checkCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 9" />
    </svg>
  ),
  bowl: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11a9 9 0 0 0 18 0z" />
      <path d="M12 5a3 3 0 0 0 3-3" />
    </svg>
  ),
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H12v18H4.5A2.5 2.5 0 0 1 2 17.5z" />
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H12v18h7.5a2.5 2.5 0 0 0 2.5-2.5z" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12" y2="8" />
    </svg>
  ),
  thumb: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-6 0v4H4v11h10.5a3 3 0 0 0 2.96-2.5L18.7 11A2 2 0 0 0 16.74 9z" />
    </svg>
  ),
  cancel: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  ),
  rotate: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.5-6.3" />
      <path d="M21 4v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3" />
      <path d="M3 20v-5h5" />
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M17 10l5-3v10l-5-3z" />
    </svg>
  ),
  watch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="3" />
      <path d="M9 6V3h6v3M9 18v3h6v-3" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Encouragement card — the soft green band with leaf + sun art that closes
// the home / assistant / check-in screens
// ---------------------------------------------------------------------------

export function EncouragementCard({
  title,
  subtitle,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  variant?: "default" | "muted";
}) {
  return (
    <div
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3"
      style={{
        background:
          variant === "default" ? "var(--p-green-bg)" : "var(--p-surface)",
        border: "1px solid var(--p-border)",
      }}
    >
      <IconBadge tone="green" size={38}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11a4 4 0 0 1 4-4h4a4 4 0 0 1 0 8h-1" />
          <path d="M15 7l-3 3 3 3" />
          <path d="M3 14c2 0 5 1 5 4" />
        </svg>
      </IconBadge>
      <div className="min-w-0 flex-1">
        <div
          className="text-[14.5px] font-semibold leading-tight"
          style={{ color: "var(--p-green-soft)" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="mt-0.5 text-[12.5px] leading-snug"
            style={{ color: "var(--p-muted)" }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <LeafSun />
    </div>
  );
}

function LeafSun() {
  return (
    <svg
      aria-hidden
      width="80"
      height="50"
      viewBox="0 0 80 50"
      className="absolute right-1 top-1/2 -translate-y-1/2"
      style={{ opacity: 0.9 }}
    >
      <circle cx="62" cy="14" r="8" fill="#e8b04a" />
      <path d="M14 38 Q 32 14 50 30 Q 38 46 14 38 Z" fill="#3f7d4d" opacity="0.9" />
      <path d="M30 44 Q 48 28 64 40 Q 56 50 30 44 Z" fill="#6aa572" opacity="0.85" />
      <path d="M22 30 Q 30 22 38 28" stroke="#2e5a3a" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Card primitive
// ---------------------------------------------------------------------------

export function PatientCard({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn("rounded-[22px]", padded && "p-4", className)}
      style={{
        background: "var(--p-surface)",
        border: "1px solid var(--p-border)",
      }}
    >
      {children}
    </div>
  );
}
