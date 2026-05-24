import { cn } from "@/lib/cn";
import * as React from "react";

export function GlassCard({
  className,
  strong,
  flat,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean; flat?: boolean }) {
  return (
    <div
      className={cn(
        flat ? "glass-flat" : strong ? "glass-strong" : "glass",
        "rounded-xl",
        className,
      )}
      {...rest}
    />
  );
}

export function PrimaryButton({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold tracking-tight transition",
        "bg-[var(--accent)] text-[var(--accent-fg)]",
        "hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50",
        "border border-[rgba(201,154,50,0.55)]",
        className,
      )}
      {...rest}
    />
  );
}

export function GhostButton({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium",
        "border border-[var(--border-strong)] text-[var(--ink-2)] bg-[var(--surface)]/78",
        "hover:bg-[var(--surface-2)] hover:border-[rgba(201,154,50,0.48)] hover:text-[var(--ink)] transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}

export function GoldAccentButton({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
        "bg-[var(--gold-bg)] text-[var(--gold-soft)] border border-[rgba(201,154,50,0.48)]",
        "hover:bg-[rgba(201,154,50,0.18)] hover:border-[rgba(201,154,50,0.72)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}

export function Pill({
  className,
  tone = "neutral",
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "confidential" | "open" | "aps" | "live";
}) {
  const tones: Record<string, string> = {
    neutral:
      "bg-[var(--surface)]/80 text-[var(--muted)] border-[var(--border-strong)]",
    confidential:
      "bg-[var(--gold-bg)] text-[var(--gold-soft)] border-[rgba(201,154,50,0.48)]",
    open:
      "bg-[rgba(34,197,94,0.12)] text-[#86efac] border-[rgba(134,239,172,0.28)]",
    aps:
      "bg-[rgba(96,165,250,0.12)] text-[#93c5fd] border-[rgba(147,197,253,0.28)]",
    live:
      "bg-[var(--gold-bg)] text-[var(--gold-soft)] border-[var(--border-strong)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-[-0.01em]",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

export function HaloMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "var(--gold)",
        }}
      />
      <span
        className="absolute rounded-full bg-[var(--surface)]"
        style={{ inset: 2 }}
      />
      <span
        className="absolute rounded-full"
        style={{
          inset: 6,
          background: "var(--ink)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      />
    </span>
  );
}
