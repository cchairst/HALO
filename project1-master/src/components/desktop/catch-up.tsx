import {
  ArrowRight,
  Clipboard,
  ClipboardList,
  Clock,
  Filter,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CatchUpData } from "@/lib/catch-up";
import { CATCH_UP } from "@/lib/desktop-demo";
import { Avatar, Panel, RiskPill, StatusDot } from "./bits";
import { DesktopFooter } from "./shift-hub";
import { DesktopTopBar } from "./top-bar";

export function DesktopCatchUp({ data }: { data?: CatchUpData }) {
  const D = CATCH_UP;
  const statRows = [
    {
      ...D.stats[0],
      value: String(data?.stats.openThreads ?? D.stats[0].value),
      delta: data ? "last 24h" : D.stats[0].delta,
    },
    {
      ...D.stats[1],
      value: String(data?.stats.urgentUpdates ?? D.stats[1].value),
      delta: data ? "unresolved high" : D.stats[1].delta,
    },
    D.stats[2],
    {
      ...D.stats[3],
      value: String(data?.stats.unresolvedItems ?? D.stats[3].value),
      delta: data ? "open reports" : D.stats[3].delta,
    },
    {
      ...D.stats[4],
      value: String(data?.stats.patientsNeedingAttention ?? D.stats[4].value),
      delta: data ? "high or med reports" : D.stats[4].delta,
    },
  ];
  const recentActivity = data
    ? data.recentActivity.map((row) => ({
        time: row.time,
        severity: row.icon === "alert" ? "high" : "low",
        title: row.title,
        by: row.by,
        room: row.tag,
        chip: undefined as string | undefined,
      }))
    : D.recentActivity;
  const unresolved = data
    ? data.unresolved.map((row) => ({
        severity: row.severity,
        title: row.title,
        patient: row.who,
        due: row.due,
        role: row.severity === "high" ? "High" : row.severity === "med" ? "Med" : "Low",
        detail: row.who,
        action: "Review and resolve from chart",
        room: row.who.match(/\(([^)]+)\)/)?.[1] ?? "",
      }))
    : D.unresolved;
  const needingAttention = data
    ? data.needingAttention.map((row) => ({
        severity: row.severity,
        count: 1,
        label: `${row.name}${row.room ? ` (${row.room})` : ""}`,
        note: row.statusLine,
        room: row.timeAgo,
      }))
    : D.needingAttention;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6">
        <div>
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
            Catch Up
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">{D.blurb}</p>
        </div>
        <DesktopTopBar time="7:42 AM" alertsCount={3} />
      </div>

      {/* Stats + handoff CTA */}
      <div className="px-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {statRows.map((s) => (
            <CatchUpStat
              key={s.label}
              label={s.label}
              value={s.value}
              delta={s.delta}
              tone={s.tone}
              icon={iconForCatchUp(s.icon)}
            />
          ))}
          <Panel className="flex flex-col items-end justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(201,154,50,0.55)] bg-[var(--gold-bg)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--gold-soft)]"
            >
              Jump to handoff <ArrowRight className="size-3.5" />
            </button>
            <div className="text-right text-[11px] text-[var(--muted)]">
              <div>{D.handoff.endsIn}</div>
              <a href="#" className="text-[var(--gold-soft)]">View handoff -&gt;</a>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 px-6 py-3 lg:grid-cols-3">
        {/* Col 1: Recent activity */}
        <Panel>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">
              Recent activity
            </h3>
            <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">Mark all as read</a>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <DropdownGhost>All activity</DropdownGhost>
            <button className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-2)]">
              <Filter className="size-3" /> Filters
            </button>
          </div>
          <div className="flex flex-col">
            {recentActivity.map((row, i) => (
              <div key={i} className="grid grid-cols-[62px_18px_1fr_auto] items-start gap-2 py-1.5">
                <span className="text-[11px] text-[var(--muted)]">{row.time}</span>
                <StatusDot tone={severityToDot(row.severity)} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.severity === "high" && (
                      <RiskPill severity="high" className="!py-0">High</RiskPill>
                    )}
                    <span className="truncate text-[12.5px] text-[var(--ink-2)]">
                      {row.title}
                    </span>
                    {row.chip && (
                      <span className="inline-flex items-center rounded-md border border-[rgba(248,113,113,0.32)] bg-[rgba(239,68,68,0.12)] px-1 py-[1px] text-[10px] font-semibold text-[#f87171]">
                        {row.chip}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">{row.by}</div>
                </div>
                <span className="text-[10.5px] text-[var(--muted)]">{row.room}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 text-center">
            <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
              View full activity feed -&gt;
            </a>
          </div>
        </Panel>

        {/* Col 2: Unresolved + follow-ups */}
        <div className="flex flex-col gap-3">
          <Panel>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">
                Unresolved items ({data?.stats.unresolvedItems ?? D.unresolved.length + 8})
              </h3>
            </div>
            <div className="mb-2 flex items-center gap-3 text-[12px] font-semibold">
              <TabActive>All</TabActive><CountBadge>{String(data?.stats.unresolvedItems ?? 11)}</CountBadge>
              <Tab>High</Tab><CountBadge>{String(data?.stats.urgentUpdates ?? 3)}</CountBadge>
              <Tab>Med</Tab><CountBadge>{String(data ? unresolved.filter((u) => u.severity === "med").length : 5)}</CountBadge>
              <Tab>Low</Tab><CountBadge>{String(data ? unresolved.filter((u) => u.severity === "low").length : 3)}</CountBadge>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <DropdownGhost>Sort: Priority</DropdownGhost>
              <button className="grid size-7 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                <Filter className="size-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {unresolved.map((u, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusDot tone={severityToDot(u.severity)} />
                      <RiskPill severity={u.severity === "med" ? "med" : u.severity === "low" ? "low" : "high"}>
                        {u.severity === "high" ? "High" : u.severity === "med" ? "Med" : "Low"}
                      </RiskPill>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                      <Clock className="size-3" /> {u.due}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[12.5px] font-semibold text-[var(--ink)]">
                    {u.title}
                  </div>
                  <div className="text-[11.5px] text-[var(--muted)]">{u.patient}</div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--ink-2)]">
                    <span
                      className="rounded-md px-1.5 py-[1px] text-[10px] font-semibold"
                      style={{ background: "var(--gold-bg)", color: "var(--gold-soft)" }}
                    >
                      {u.role}
                    </span>
                    <span className="truncate">{u.detail}</span>
                    <span className="ml-auto text-[10.5px] text-[var(--muted)]">{u.room}</span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-[var(--ink-2)]">{u.action}</div>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all unresolved -&gt;
              </a>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-2 text-[14px] font-semibold tracking-tight text-[var(--ink)]">
              Your follow-ups due ({D.followUps.all})
            </h3>
            <div className="mb-2 flex items-center gap-3 text-[12px] font-semibold">
              <TabActive>All</TabActive>
              <Tab>Mine</Tab><CountBadge>{String(D.followUps.mine)}</CountBadge>
              <Tab>Owned by team</Tab><CountBadge>{String(D.followUps.team)}</CountBadge>
              <DropdownGhost>Sort: Due soon</DropdownGhost>
            </div>
            <div className="flex flex-col gap-2">
              {D.followUps.items.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[80px_1fr_auto] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2"
                >
                  <span className="text-[11px] font-semibold text-[#f87171]">{it.due}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <RiskPill severity={it.severity as "high" | "med"}>
                        {it.severity === "high" ? "High" : "Med"}
                      </RiskPill>
                      <span className="truncate text-[12.5px] font-medium text-[var(--ink-2)]">
                        {it.title}
                      </span>
                    </div>
                    <div className="truncate text-[11px] text-[var(--muted)]">
                      {it.patient} - {it.by}
                    </div>
                  </div>
                  <span className="text-[10.5px] text-[var(--muted)]">{it.room}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all follow-ups -&gt;
              </a>
            </div>
          </Panel>
        </div>

        {/* Col 3: Needing attention + Recent threads */}
        <div className="flex flex-col gap-3">
          <Panel>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">
                Patients needing attention ({data?.stats.patientsNeedingAttention ?? 34})
              </h3>
              <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">View all</a>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {needingAttention.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[18px_56px_1fr_1.1fr_auto] items-center gap-2 py-2"
                >
                  <StatusDot tone={severityToDot(row.severity)} />
                  <span
                    className={cn(
                      "text-[12px] font-semibold",
                      row.severity === "high"
                        ? "text-[#f87171]"
                        : row.severity === "med"
                          ? "text-[#facc15]"
                          : "text-[#86efac]",
                    )}
                  >
                    {row.severity === "high" ? "High" : row.severity === "med" ? "Med" : "Low"} {row.count}
                  </span>
                  <span className="truncate text-[12.5px] font-medium text-[var(--ink)]">
                    {row.label}
                  </span>
                  <span className="truncate text-[11.5px] text-[var(--muted)]">{row.note}</span>
                  <span className="text-right text-[10.5px] text-[var(--muted)]">{row.room}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all patients -&gt;
              </a>
            </div>
          </Panel>

          <Panel>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">Recent threads</h3>
              <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">View all</a>
            </div>
            <div className="flex flex-col">
              {D.recentThreads.map((c) => (
                <div key={c.name} className="flex items-center gap-2 py-1.5">
                  <Avatar initials={initials(c.name)} size={28} bg="#1c1c1f" fg="#d9d3c5" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
                      {c.name}
                    </div>
                    <div className="truncate text-[11px] text-[var(--muted)]">{c.preview}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[10px] text-[var(--muted)]">{c.time}</span>
                    {c.unread ? (
                      <span
                        className="grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none"
                        style={{ background: "var(--gold)", color: "#1b1712" }}
                      >
                        {c.unread}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <DesktopFooter />
    </div>
  );
}

function CatchUpStat({
  icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  tone: "up" | "critical" | "neutral";
}) {
  const deltaColor =
    tone === "critical" ? "text-[#f87171]" : tone === "up" ? "text-[#86efac]" : "text-[var(--muted)]";
  return (
    <Panel className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--gold-soft)]">
          {icon}
        </span>
        <span className="text-[11.5px] font-semibold text-[var(--muted)]">{label}</span>
      </div>
      <div className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-[var(--ink)]">
        {value}
      </div>
      <div className={cn("flex items-center gap-1 text-[11px] font-semibold", deltaColor)}>
        {tone === "up" && <span aria-hidden>▲</span>}
        {tone === "critical" && <span aria-hidden>●</span>}
        {delta}
      </div>
    </Panel>
  );
}

function iconForCatchUp(name: string) {
  switch (name) {
    case "chats":
      return <MessageSquare className="size-4" />;
    case "spark":
      return <Sparkles className="size-4" />;
    case "clock":
      return <Clock className="size-4" />;
    case "clipboard":
      return <ClipboardList className="size-4" />;
    case "users":
      return <Users className="size-4" />;
    default:
      return <Clipboard className="size-4" />;
  }
}

function DropdownGhost({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-2)]"
    >
      {children}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="m2 4 3 3 3-3" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
  );
}

function Tab({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--muted)]">{children}</span>;
}

function TabActive({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-b-2 border-[var(--gold)] pb-1 text-[var(--gold-soft)]">{children}</span>
  );
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
      {children}
    </span>
  );
}

function severityToDot(s: string): "high" | "med" | "low" | "info" | "stable" {
  if (s === "high" || s === "critical" || s === "unstable") return "high";
  if (s === "med" || s === "watch") return "med";
  if (s === "info") return "info";
  return "low";
}

function initials(name: string) {
  return name
    .replace(/Room \d+\s*-\s*/i, "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
