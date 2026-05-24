import {
  Bed,
  CheckCircle2,
  Clipboard,
  FlaskConical,
  HeartPulse,
  Inbox,
  MessageCircle,
  Pill,
  PlusSquare,
  Repeat,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CatchUpData } from "@/lib/catch-up";
import { SHIFT_HUB } from "@/lib/desktop-demo";
import { Avatar, Panel, RiskPill, StatusDot } from "./bits";
import { DesktopTopBar } from "./top-bar";

export function DesktopShiftHub({ stats }: { stats?: CatchUpData["stats"] }) {
  const D = SHIFT_HUB;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
            Shift Hub
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">{D.subtitle}</p>
        </div>
        <DesktopTopBar time="7:42 AM" alertsCount={6} />
      </div>

      {/* Handoff strip */}
      <div className="px-6">
        <Panel className="!p-0">
          <div className="grid grid-cols-1 items-center gap-y-3 px-4 py-3 md:grid-cols-[140px_1.4fr_1fr_1.1fr_auto]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              <div>HANDOFF</div>
              <div className="mt-0.5 text-[12.5px] font-semibold normal-case tracking-normal text-[var(--ink)]">
                {D.handoff.direction}
              </div>
            </div>
            <div className="border-l border-[var(--border)] pl-4">
              <div className="text-[12.5px] font-semibold text-[var(--ink)]">
                Handoff in progress
              </div>
              <div className="text-[11.5px] text-[var(--muted)]">
                {D.handoff.started}
              </div>
            </div>
            <div className="border-l border-[var(--border)] pl-4">
              <div className="text-[12.5px] font-semibold text-[var(--ink)]">Highlighted</div>
              <div className="text-[11.5px] text-[var(--muted)]">{D.handoff.highlighted}</div>
            </div>
            <div className="border-l border-[var(--border)] pl-4">
              <div className="text-[12.5px] font-semibold text-[var(--ink)]">Patients</div>
              <div className="text-[11.5px] text-[var(--muted)]">{D.handoff.patients}</div>
            </div>
            <div className="border-l border-[var(--border)] pl-4 text-right">
              <div className="text-[12.5px] font-semibold text-[var(--ink)]">
                {D.handoff.endsIn}
              </div>
              <a href="#" className="text-[11.5px] font-semibold text-[var(--gold-soft)]">
                View handoff -&gt;
              </a>
            </div>
          </div>
        </Panel>
      </div>

      {/* 6 stat cards */}
      <div className="px-6 pt-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat icon={<MessageCircle className="size-4" />} label="Open chats" value={String(stats?.openThreads ?? 18)} delta="last 24h" tone="up" />
          <Stat icon={<ShieldCheck className="size-4" />} label="Urgent updates" value={String(stats?.urgentUpdates ?? 7)} delta="unresolved high" tone="critical" />
          <Stat icon={<Clipboard className="size-4" />} label="Unresolved reports" value={String(stats?.unresolvedItems ?? 11)} delta="open reports" tone="up" />
          <Stat icon={<UsersRound className="size-4" />} label="Active patients" value={String(stats?.patientsNeedingAttention ?? 34)} delta="need attention" tone="up" />
          <Stat icon={<Bed className="size-4" />} label="Beds occupied" value="89%" delta="161 / 180" tone="neutral" />
          <Stat icon={<CheckCircle2 className="size-4" />} label="Follow-ups due" value="14" delta="Overdue: 3" tone="critical" />
        </div>
      </div>

      {/* 3-column main grid */}
      <div className="grid flex-1 grid-cols-1 gap-3 px-6 py-3 lg:grid-cols-3">
        {/* Column 1 */}
        <div className="flex flex-col gap-3">
          <Panel>
            <SectionTitle title={`Priority patients (12)`} right={<TextLink>View all</TextLink>} />
            <div className="grid grid-cols-[1.2fr_50px_60px_1fr_60px] items-center gap-2 pb-2 pl-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              <span>PATIENT</span>
              <span>ROOM</span>
              <span>RISK</span>
              <span>STATUS</span>
              <span className="text-right">UPDATED</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {D.priorityPatients.map((p) => (
                <div
                  key={p.name}
                  className="grid grid-cols-[1.2fr_50px_60px_1fr_60px] items-center gap-2 py-2 pl-1"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot tone={p.risk === "high" ? "high" : p.risk === "med" ? "med" : "low"} />
                    <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--ink-2)]">{p.room}</span>
                  <RiskPill severity={p.risk as "high" | "med" | "low"}>
                    {p.risk === "high" ? "High" : p.risk === "med" ? "Med" : "Low"}
                  </RiskPill>
                  <span className="truncate text-[12px] text-[var(--ink-2)]">{p.status}</span>
                  <span className="text-right text-[11px] text-[var(--muted)]">{p.updated}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all priority patients -&gt;
              </a>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Team coverage" right={<TextLink>View schedule</TextLink>} />
            <div className="grid grid-cols-[1fr_1.1fr_70px] gap-2 pb-1 pl-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              <span>ROLE</span>
              <span>ON SHIFT</span>
              <span>STATUS</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {D.teamCoverage.map((row) => (
                <div key={row.role} className="grid grid-cols-[1fr_1.1fr_70px] items-center gap-2 py-2 pl-1">
                  <span className="text-[12.5px] text-[var(--ink-2)]">{row.role}</span>
                  <span className="text-[12.5px] text-[var(--ink-2)]">{row.who}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[12px] font-semibold",
                      row.status === "On unit" ? "text-[#86efac]" : "text-[#60a5fa]",
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: row.status === "On unit" ? "#22c55e" : "#60a5fa" }}
                    />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-3">
          <Panel>
            <SectionTitle title="Live care feed" right={<DropdownGhost>All activity</DropdownGhost>} />
            <div className="flex flex-col">
              {D.liveFeed.map((row, i) => (
                <div key={i} className="grid grid-cols-[60px_24px_1fr_auto] items-start gap-2 py-1.5">
                  <span className="text-[11.5px] text-[var(--muted)]">{row.time}</span>
                  <FeedIcon kind={row.icon} />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-[var(--ink-2)]">
                      {row.title}
                      {row.chip && (
                        <span className="ml-2 inline-flex items-center rounded-md border border-[rgba(248,113,113,0.3)] bg-[rgba(239,68,68,0.12)] px-1 py-[1px] text-[10px] font-semibold text-[#f87171]">
                          {row.chip}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-[var(--muted)]">{row.by}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View full feed -&gt;
              </a>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Upcoming tasks" right={null} />
            <div className="-mt-2 flex items-center gap-4 pb-3 text-[12.5px] font-semibold">
              <span className="border-b-2 border-[var(--gold)] pb-1 text-[var(--gold-soft)]">
                Tasks ({D.upcomingTasks.tasks})
              </span>
              <span className="text-[var(--muted)]">Meds ({D.upcomingTasks.meds})</span>
              <span className="text-[var(--muted)]">Rounds ({D.upcomingTasks.rounds})</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {D.upcomingTasks.items.map((it) => (
                <div key={it.title} className="grid grid-cols-[64px_1fr_auto] items-center gap-2 py-2">
                  <span className="text-[11.5px] font-semibold text-[var(--ink-2)]">
                    {it.time}
                  </span>
                  <span className="truncate text-[12.5px] text-[var(--ink-2)]">{it.title}</span>
                  <span className="text-[11.5px] text-[var(--muted)]">{it.who}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all tasks -&gt;
              </a>
            </div>
          </Panel>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-3">
          <Panel>
            <SectionTitle title="Recent handoff notes" right={<TextLink>View all</TextLink>} />
            <div className="flex flex-col gap-3">
              {D.handoffNotes.map((n) => (
                <div key={n.headline}>
                  <div className="text-[11px] font-semibold text-[var(--muted)]">{n.time}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-[var(--ink-2)]">
                    {n.headline}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[var(--muted)]">{n.by}</div>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all handoff notes -&gt;
              </a>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title={`Unresolved items (${D.unresolved.length + 6})`} right={<TextLink>View all</TextLink>} />
            <div className="flex flex-col">
              {D.unresolved.map((u, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <UnresolvedIcon kind={u.icon} />
                  <span className="flex-1 truncate text-[12.5px] text-[var(--ink-2)]">
                    {u.label}
                  </span>
                  <RiskPill severity={u.severity as "high" | "med" | "low"}>
                    {u.severity === "high" ? "High" : u.severity === "med" ? "Med" : "Low"}
                  </RiskPill>
                  <span className="ml-2 text-[11px] text-[var(--muted)]">{u.due}</span>
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
            <SectionTitle title="Recent chats" right={<TextLink>View all</TextLink>} />
            <div className="flex flex-col">
              {D.recentChats.map((c) => (
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

function SectionTitle({
  title,
  right,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-[13.5px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      {right}
    </div>
  );
}

function TextLink({ children }: { children: React.ReactNode }) {
  return (
    <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
      {children}
    </a>
  );
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

function Stat({
  icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "critical" | "neutral";
}) {
  const deltaColor =
    tone === "critical" ? "text-[#f87171]" : tone === "up" ? "text-[#86efac]" : "text-[var(--muted)]";
  return (
    <Panel className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--gold-soft)]">
          {icon}
        </span>
        <span className="text-[11.5px] font-semibold tracking-tight text-[var(--muted)]">{label}</span>
      </div>
      <div className="text-[28px] font-semibold tracking-[-0.04em] text-[var(--ink)]">{value}</div>
      {delta && (
        <div className={cn("flex items-center gap-1 text-[11px] font-semibold", deltaColor)}>
          {tone === "up" && <span aria-hidden>▲</span>}
          {tone === "critical" && <span aria-hidden>●</span>}
          {delta}
        </div>
      )}
    </Panel>
  );
}

function FeedIcon({ kind }: { kind: string }) {
  const map: Record<string, React.ReactNode> = {
    chat: <MessageCircle className="size-3.5" />,
    alert: <ShieldCheck className="size-3.5" />,
    stethoscope: <Stethoscope className="size-3.5" />,
    calendar: <HeartPulse className="size-3.5" />,
    syringe: <Syringe className="size-3.5" />,
    clipboard: <Clipboard className="size-3.5" />,
    users: <Users className="size-3.5" />,
  };
  const color: Record<string, string> = {
    chat: "text-[#86efac]",
    alert: "text-[#facc15]",
    stethoscope: "text-[#facc15]",
    calendar: "text-[#86efac]",
    syringe: "text-[#60a5fa]",
    clipboard: "text-[#60a5fa]",
    users: "text-[#c4b5fd]",
  };
  return (
    <span className={cn("mt-0.5 grid size-5 place-items-center", color[kind] ?? "text-[var(--muted)]")}>
      {map[kind]}
    </span>
  );
}

function UnresolvedIcon({ kind }: { kind: string }) {
  const map: Record<string, React.ReactNode> = {
    flask: <FlaskConical className="size-3.5" />,
    clipboard: <Clipboard className="size-3.5" />,
    loop: <Repeat className="size-3.5" />,
    pill: <Pill className="size-3.5" />,
    inbox: <Inbox className="size-3.5" />,
  };
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--surface-2)] text-[var(--gold-soft)]">
      {map[kind] ?? <Clipboard className="size-3.5" />}
    </span>
  );
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

export function DesktopFooter() {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] px-6 py-3 text-[11.5px] text-[var(--muted)]">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-3.5 text-[var(--gold-soft)]" />
        <span>Patient safety always</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <PlusSquare className="size-3.5 text-[var(--muted)]" />
          Secure
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-[var(--muted)]" />
          HIPAA Compliant
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-[#86efac]" />
          Last synced 7:42 AM
        </span>
      </div>
    </div>
  );
}
