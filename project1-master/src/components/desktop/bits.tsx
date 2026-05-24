// Small, design-token-aligned bits reused across the desktop screens.
// Pill colors here mirror the mockups exactly; CSS variables don't carry
// the bright red/yellow/green hues we need, so they're inline rgba.

import { cn } from "@/lib/cn";
import type { Severity } from "@/lib/desktop-demo";

export function RiskPill({
  severity,
  className,
  children,
}: {
  severity: Severity | "high" | "med" | "low" | "critical" | "stable" | "unstable" | "watch" | "info";
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    high: "bg-[rgba(239,68,68,0.14)] text-[#f87171] border-[rgba(248,113,113,0.32)]",
    critical: "bg-[rgba(239,68,68,0.14)] text-[#f87171] border-[rgba(248,113,113,0.32)]",
    unstable: "bg-[rgba(239,68,68,0.14)] text-[#f87171] border-[rgba(248,113,113,0.32)]",
    med: "bg-[rgba(234,179,8,0.12)] text-[#facc15] border-[rgba(250,204,21,0.32)]",
    watch: "bg-[rgba(234,179,8,0.12)] text-[#facc15] border-[rgba(250,204,21,0.32)]",
    low: "bg-[rgba(34,197,94,0.14)] text-[#86efac] border-[rgba(134,239,172,0.32)]",
    stable: "bg-[rgba(34,197,94,0.14)] text-[#86efac] border-[rgba(134,239,172,0.32)]",
    info: "bg-[rgba(96,165,250,0.12)] text-[#93c5fd] border-[rgba(147,197,253,0.32)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tracking-tight",
        tones[severity],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Round colored dot — used as a leading indicator on rows.
export function StatusDot({ tone }: { tone: "high" | "med" | "low" | "info" | "stable" }) {
  const colors: Record<string, string> = {
    high: "#ef4444",
    med: "#eab308",
    low: "#22c55e",
    stable: "#22c55e",
    info: "#60a5fa",
  };
  return (
    <span
      className="inline-block size-2 rounded-full"
      style={{ background: colors[tone] }}
    />
  );
}

export function Avatar({
  initials,
  size = 32,
  bg = "#1f1d18",
  fg = "#d9b257",
  presence,
  ring,
}: {
  initials: string;
  size?: number;
  bg?: string;
  fg?: string;
  presence?: "active" | "idle";
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        ring ? "ring-2 ring-[rgba(217,178,87,0.32)] ring-offset-2 ring-offset-[var(--surface)]" : "",
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.max(10, size * 0.34),
        letterSpacing: "-0.01em",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-hidden
    >
      {initials}
      {presence && (
        <span
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2"
          style={{
            background: presence === "active" ? "#22c55e" : "#eab308",
            borderColor: "var(--background)",
          }}
        />
      )}
    </span>
  );
}

// Soft "Med" / "Imaging" / "Therapy" / "New" tags shown in the mockups.
export function MutedTag({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "blue" | "purple" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    default: "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]",
    gold: "bg-[var(--gold-bg)] text-[var(--gold-soft)] border-[rgba(201,154,50,0.32)]",
    blue: "bg-[rgba(96,165,250,0.12)] text-[#93c5fd] border-[rgba(147,197,253,0.28)]",
    purple: "bg-[rgba(167,139,250,0.12)] text-[#c4b5fd] border-[rgba(196,181,253,0.28)]",
    green: "bg-[rgba(34,197,94,0.12)] text-[#86efac] border-[rgba(134,239,172,0.28)]",
    red: "bg-[rgba(239,68,68,0.12)] text-[#f87171] border-[rgba(248,113,113,0.28)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-[1px] text-[10.5px] font-semibold tracking-tight",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// The thin card surface the mockups use everywhere — slight border, dark
// fill, no glass blur.
export function Panel({
  children,
  className,
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}) {
  const pad = padding === "none" ? "" : padding === "sm" ? "p-3" : "p-4";
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85",
        pad,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  right,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {title}
      </h3>
      {right}
    </div>
  );
}
