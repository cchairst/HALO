"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  CircleUserRound,
  ClipboardPlus,
  HeartPulse,
  House,
  Sparkles,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { HaloMark } from "@/components/glass";

type RailLabelKey = "chats" | "catchUp" | "patients" | "wellness" | "home";

type RailItem = {
  href: string;
  labelKey: RailLabelKey;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const ITEMS: RailItem[] = [
  { href: "/messages", labelKey: "chats", Icon: MessageSquareText },
  { href: "/catch-up", labelKey: "catchUp", Icon: ClipboardPlus },
  { href: "/recipients", labelKey: "patients", Icon: HeartPulse },
  { href: "/wellness", labelKey: "wellness", Icon: Sparkles },
  { href: "/dashboard", labelKey: "home", Icon: House },
];

export type RailLabels = Record<RailLabelKey, string> & {
  haloHome: string;
  create: string;
  profile: string;
  wellness: string;
};

export function ServerRail({ labels }: { labels: RailLabels }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col items-center gap-2 w-[72px] shrink-0 py-3 bg-[var(--surface-2)] border-r border-[var(--border)]">
      <Link
        href="/dashboard"
        aria-label={labels.haloHome}
        className="size-10 rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] flex items-center justify-center transition"
      >
        <HaloMark size={26} />
      </Link>

      <div className="h-px w-8 bg-[var(--border)] my-1" />

      <nav className="flex flex-col gap-1.5">
        {ITEMS.map(({ href, labelKey, Icon, badge }) => {
          const label = labels[labelKey];
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="group relative"
            >
              {/* active indicator pill */}
              <span
                className={cn(
                  "absolute -left-3 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-[var(--gold)] transition-all",
                  active
                    ? "h-7 opacity-100"
                    : "h-2 opacity-0 group-hover:opacity-60 group-hover:h-4",
                )}
              />
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center transition relative",
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl"
                    : "bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--ink-2)] hover:rounded-xl hover:border-[var(--ink)]/30",
                )}
              >
                <Icon className="size-5" />
                {badge ? (
                  <span className="absolute -bottom-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--surface-2)]">
                    {badge}
                  </span>
                ) : null}
              </div>
              {/* tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-50">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 items-center">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("halo:open-plus-drawer"))
          }
          aria-label={labels.create}
          className="size-10 rounded-xl bg-[var(--surface)] border border-[rgba(212,168,71,0.5)] text-[var(--gold-soft)] flex items-center justify-center transition hover:border-[var(--gold)] hover:bg-[var(--gold-bg)] active:scale-95"
        >
          <Plus className="size-5" />
        </button>
        <Link
          href="/switch"
          aria-label={labels.profile}
          className="size-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] flex items-center justify-center hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition"
        >
          <CircleUserRound className="size-4.5" />
        </Link>
      </div>
    </aside>
  );
}
