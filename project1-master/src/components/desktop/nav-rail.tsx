"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  HeartPulse,
  House,
  MessageSquareText,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { HaloMark } from "@/components/glass";

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

// Single canonical icon order across all five screens. The active page gets
// a gold-tinted fill; everything else is muted with a hover lift.
const ITEMS: Item[] = [
  { href: "/dashboard", label: "Shift Hub", Icon: House },
  { href: "/messages", label: "Chats", Icon: MessageSquareText },
  { href: "/recipients", label: "Care teams", Icon: HeartPulse },
  { href: "/catch-up", label: "Catch Up", Icon: ClipboardList },
  { href: "/wellness", label: "Wellness", Icon: Sparkles },
];

export function DesktopNavRail({ initials = "C" }: { initials?: string }) {
  const pathname = usePathname() ?? "";
  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-[64px] shrink-0 flex-col items-center gap-3 border-r border-[var(--border)] bg-[var(--background)] py-4">
      <Link
        href="/dashboard"
        aria-label="Halo home"
        className="grid size-9 place-items-center rounded-xl"
      >
        <HaloMark size={28} />
      </Link>

      <nav className="mt-2 flex flex-col items-center gap-1.5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(href + "/") ||
            (href === "/recipients" && pathname.startsWith("/recipients/"));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "group relative grid size-10 place-items-center rounded-xl transition",
                active
                  ? "bg-[var(--gold-bg)] text-[var(--gold-soft)] ring-1 ring-[rgba(201,154,50,0.42)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink-2)]",
              )}
            >
              <Icon className="size-[18px]" />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[var(--surface-2)] px-2 py-1 text-[11px] font-medium text-[var(--ink-2)] opacity-0 transition group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <Link
          href="/switch"
          aria-label="Settings"
          className="grid size-10 place-items-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink-2)]"
        >
          <Settings className="size-[18px]" />
        </Link>
        <Link
          href="/switch"
          aria-label="Account"
          className="grid size-9 place-items-center rounded-full border border-[var(--border-strong)] text-[12px] font-bold text-[#1b1712]"
          style={{ background: "var(--gold)" }}
        >
          {initials}
        </Link>
      </div>
    </aside>
  );
}
