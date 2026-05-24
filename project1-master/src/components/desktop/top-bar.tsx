import { Bell, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

// The page utility row: optional "On shift" pill, time, Create, Alerts, and
// kebab menu. Used on Shift Hub, Catch Up, Patient chart, Chat. Pages that
// need bespoke right-side controls (Care Teams: Invite/Add) render their
// own variant inline rather than reusing this.

export function DesktopTopBar({
  showOnShift = true,
  time = "7:42 AM",
  alertsCount = 5,
  showCreate = true,
  showKebab = true,
  className,
}: {
  showOnShift?: boolean;
  time?: string;
  alertsCount?: number;
  showCreate?: boolean;
  showKebab?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showOnShift && (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.1)] px-2 py-1 text-[11.5px] font-semibold text-[#86efac]">
          <span className="status-dot" />
          On shift
        </span>
      )}
      <span className="text-[12.5px] font-semibold text-[var(--ink-2)]">{time}</span>
      {showCreate && (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--ink-2)] transition hover:border-[rgba(201,154,50,0.45)]"
        >
          <Plus className="size-3.5" />
          Create
        </button>
      )}
      <button
        type="button"
        className="relative inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--ink-2)] transition hover:border-[rgba(201,154,50,0.45)]"
      >
        <Bell className="size-3.5" />
        Alerts
        {alertsCount ? (
          <span
            className="ml-1 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{ background: "var(--gold)", color: "#1b1712" }}
          >
            {alertsCount}
          </span>
        ) : null}
      </button>
      {showKebab && (
        <button
          type="button"
          aria-label="More"
          className="grid size-8 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink-2)]"
        >
          <MoreHorizontal className="size-4" />
        </button>
      )}
    </div>
  );
}
