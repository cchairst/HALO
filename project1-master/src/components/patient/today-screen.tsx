import Link from "next/link";
import {
  AvatarChip,
  EncouragementCard,
  HaloLogo,
  I,
  IconBadge,
  PatientCard,
  PatientShell,
  ProgressRing,
} from "@/components/patient/primitives";

export type PatientTaskCard = {
  id: string;
  title: string;
  subtitle: string | null;
  kind: string;
  completedAt: Date | null;
};

// Map task.kind → (icon, tone) for the Today list. New kinds added on the
// doctor side fall through to the "other" preset so they still render.
function presetForKind(kind: string): {
  tone: "green" | "blue" | "purple" | "red";
  icon: React.ReactNode;
} {
  switch (kind) {
    case "walk":
      return { tone: "green", icon: I.walk };
    case "incision":
      return { tone: "blue", icon: I.camera };
    case "meds":
      return { tone: "purple", icon: I.pill };
    case "pain":
      return { tone: "red", icon: I.heart };
    default:
      return { tone: "blue", icon: I.camera };
  }
}

function firstName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(",")[0].split(" ")[0];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function PatientTodayScreen({
  user,
  tasks = [],
}: {
  user: { id: string; name: string };
  tasks?: PatientTaskCard[];
}) {
  const pending = tasks.filter((t) => !t.completedAt);
  const completed = tasks.filter((t) => t.completedAt);
  const visible = [...pending, ...completed];
  return (
    <PatientShell>
      {/* Top bar */}
      <header className="relative flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <HaloLogo size={26} />
          <span
            className="text-[22px] font-semibold tracking-[-0.02em]"
            style={{ color: "var(--p-ink)" }}
          >
            Halo
          </span>
        </div>
        <Link href="/profile" aria-label="Profile">
          <AvatarChip initials={initials(user.name).toUpperCase()} />
        </Link>
      </header>

      {/* Greeting */}
      <div className="px-5 pt-4">
        <div>
          <h1
            className="text-[26px] font-bold leading-tight tracking-[-0.02em]"
            style={{ color: "var(--p-ink)" }}
          >
            Good morning, {firstName(user.name)} <span aria-hidden>👋</span>
          </h1>
          <p
            className="mt-1 text-[13px]"
            style={{ color: "var(--p-muted)" }}
          >
            We’re here to help you heal.
          </p>
        </div>
      </div>

      {/* Recovery status card */}
      <div className="px-5 pt-5">
        <PatientCard className="patient-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="text-[20px] font-bold tracking-[-0.01em]"
                style={{ color: "var(--p-ink)" }}
              >
                Day 4 after knee surgery
              </div>
              <div
                className="mt-2 flex items-center gap-2 text-[13.5px] font-medium"
                style={{ color: "var(--p-ink-2)" }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--p-warn)" }}
                />
                A little behind, but manageable
              </div>
              <p
                className="mt-2 text-[13px] leading-snug"
                style={{ color: "var(--p-muted)" }}
              >
                Your care team is keeping a close eye on your recovery.
              </p>
            </div>
            <ProgressRing
              value={62}
              size={108}
              stroke={9}
              label={
                <span className="font-bold" style={{ color: "var(--p-ink)" }}>
                  <span className="text-[22px]">62</span>
                  <span className="text-[13px]">%</span>
                </span>
              }
              sublabel={<span>Recovery<br />progress</span>}
            />
          </div>

          <Link
            href="/check-in"
            className="patient-cta mt-4 flex h-12 w-full items-center justify-center gap-2 px-4 text-[15px]"
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
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Start today’s check-in
            <span className="ml-auto opacity-80">{I.chevron}</span>
          </Link>
        </PatientCard>
      </div>

      {/* Today's recovery tasks */}
      <div className="px-5 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--p-warn)" }}>{I.sun}</span>
            <span
              className="text-[15.5px] font-semibold tracking-[-0.01em]"
              style={{ color: "var(--p-ink)" }}
            >
              Today’s recovery tasks
            </span>
          </div>
          <Link
            href="/progress"
            className="text-[13px] font-medium"
            style={{ color: "var(--p-green-bright)" }}
          >
            View all
          </Link>
        </div>

        <PatientCard padded={false}>
          {visible.length === 0 ? (
            <div
              className="px-4 py-6 text-center text-[13px]"
              style={{ color: "var(--p-muted)" }}
            >
              No tasks yet. Your care team will send you homework soon.
            </div>
          ) : (
            visible.map((task, i) => {
              const preset = presetForKind(task.kind);
              const done = task.completedAt !== null;
              return (
                <Link
                  key={task.id}
                  href={done ? "#" : `/check-in?taskId=${task.id}`}
                  className="flex items-center gap-3 px-3.5 py-3"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--p-border)",
                    opacity: done ? 0.7 : 1,
                  }}
                >
                  <IconBadge tone={preset.tone} size={40}>
                    {preset.icon}
                  </IconBadge>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[14.5px] font-semibold leading-tight"
                      style={{
                        color: "var(--p-ink)",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </div>
                    <div
                      className="mt-0.5 text-[12px]"
                      style={{ color: "var(--p-muted)" }}
                    >
                      {task.subtitle ?? (done ? "Completed" : "Tap to start")}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className="inline-block h-5 w-5 rounded-full"
                    style={{
                      border: done ? "0" : "1.5px solid var(--p-border-strong)",
                      background: done ? "var(--p-green)" : "transparent",
                    }}
                  />
                  <span style={{ color: "var(--p-muted-2)" }}>{I.chevron}</span>
                </Link>
              );
            })
          )}
        </PatientCard>
      </div>

      {/* Wearable + Care team grid */}
      <div className="grid grid-cols-1 gap-3 px-5 pt-5 sm:grid-cols-2">
        <PatientCard className="!p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--p-ink-2)" }}>{I.watch}</span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: "var(--p-ink)" }}
              >
                Wearable snapshot
              </span>
            </div>
            <div
              className="flex items-center gap-1 text-[10.5px] font-medium"
              style={{ color: "var(--p-muted)" }}
            >
              9:30 AM
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--p-green-bright)" }}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Stat
              icon={I.heart}
              tone="red"
              value="72"
              unit="bpm"
              label="Heart rate"
            />
            <Stat
              icon={I.moon}
              tone="purple"
              value="7h 45m"
              label="Sleep"
            />
            <Stat
              icon={I.steps}
              tone="green"
              value="4,280"
              label="Steps"
            />
            <Stat
              icon={I.drop}
              tone="blue"
              value="96"
              unit="%"
              label="SpO₂"
            />
          </div>

          <Link
            href="/progress"
            className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium"
            style={{
              background: "var(--p-surface-2)",
              color: "var(--p-ink-2)",
              border: "1px solid var(--p-border)",
            }}
          >
            <span style={{ color: "var(--p-green-bright)" }}>{I.trend}</span>
            View trends
          </Link>
        </PatientCard>

        <PatientCard className="!p-3.5">
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--p-gold)" }}>{I.sparkle}</span>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--p-ink)" }}
            >
              Care team update
            </span>
          </div>

          <div
            className="mt-3 rounded-2xl p-2.5"
            style={{
              background: "var(--p-surface-2)",
              border: "1px solid var(--p-border)",
            }}
          >
            <div className="flex items-start gap-2">
              <DoctorAvatar />
              <p
                className="text-[12px] leading-snug"
                style={{ color: "var(--p-ink-2)" }}
              >
                <span className="font-semibold">Dr. Lee</span> reviewed your last
                check-in. We adjusted today’s plan for a lighter activity day.
              </p>
            </div>
          </div>

          <div
            className="mt-2 flex items-start gap-2 rounded-xl px-2 py-2"
            style={{ color: "var(--p-green-soft)" }}
          >
            <span className="mt-0.5">{I.thumb}</span>
            <p className="text-[12px] font-medium leading-snug">
              Great work staying on top of your recovery!
            </p>
          </div>
        </PatientCard>
      </div>

      {/* Encouragement */}
      <div className="px-5 pt-5">
        <EncouragementCard
          title={`You’re doing great, ${firstName(user.name)}.`}
          subtitle="Small steps today lead to big progress."
        />
      </div>
    </PatientShell>
  );
}

function Stat({
  icon,
  tone,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode;
  tone: "green" | "purple" | "red" | "blue";
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <IconBadge tone={tone} size={34}>
        {icon}
      </IconBadge>
      <div className="min-w-0">
        <div
          className="flex items-baseline gap-0.5 text-[15px] font-bold leading-none"
          style={{ color: "var(--p-ink)" }}
        >
          {value}
          {unit && (
            <span
              className="text-[10px] font-semibold"
              style={{ color: "var(--p-muted)" }}
            >
              {unit}
            </span>
          )}
        </div>
        <div
          className="mt-0.5 text-[10.5px] font-medium"
          style={{ color: "var(--p-muted)" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function DoctorAvatar() {
  return (
    <span
      aria-hidden
      className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full"
      style={{
        background:
          "radial-gradient(circle at 40% 35%, #f1d4b4, #c98b5e 70%, #6a3f23)",
        border: "1px solid var(--p-border)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5 21c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5z" />
      </svg>
    </span>
  );
}
