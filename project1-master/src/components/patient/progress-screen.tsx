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

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PatientProgressScreen({
  user,
}: {
  user: { id: string; name: string };
}) {
  // Demo daily series for the last 7 days. Bars are normalized for display.
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const recoverySeries = [38, 44, 49, 54, 58, 60, 62];
  const stepsSeries = [800, 1500, 2400, 3100, 3800, 4100, 4280];
  const painSeries = [7, 6, 5, 5, 4, 4, 4];

  return (
    <PatientShell>
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
        <a href="/profile" aria-label="Profile">
          <AvatarChip initials={initials(user.name)} />
        </a>
      </header>

      <div className="px-5 pt-3">
        <h1
          className="text-[24px] font-bold tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          Your progress
        </h1>
      </div>

      {/* Recovery summary */}
      <div className="px-5 pt-5">
        <PatientCard>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="text-[12.5px] font-medium"
                style={{ color: "var(--p-muted)" }}
              >
                Recovery progress
              </div>
              <div
                className="mt-1 text-[28px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: "var(--p-ink)" }}
              >
                62%
              </div>
              <div
                className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium"
                style={{ color: "var(--p-green-bright)" }}
              >
                {I.trend} +8% this week
              </div>
              <p
                className="mt-2 max-w-[180px] text-[12.5px] leading-snug"
                style={{ color: "var(--p-muted)" }}
              >
                On track for full mobility by week 6.
              </p>
            </div>
            <ProgressRing
              value={62}
              size={104}
              stroke={9}
              label={
                <span className="font-bold" style={{ color: "var(--p-ink)" }}>
                  <span className="text-[20px]">62</span>
                  <span className="text-[12px]">%</span>
                </span>
              }
              sublabel="Day 4 / 42"
            />
          </div>
        </PatientCard>
      </div>

      {/* Daily recovery chart */}
      <div className="px-5 pt-4">
        <PatientCard>
          <div className="flex items-center justify-between">
            <div
              className="text-[14.5px] font-semibold"
              style={{ color: "var(--p-ink)" }}
            >
              Recovery score
            </div>
            <span
              className="patient-chip px-3 py-1 text-[11.5px]"
            >
              Last 7 days
            </span>
          </div>

          <BarChart
            data={recoverySeries.map((v, i) => ({ label: days[i], value: v }))}
            max={100}
            unit="%"
            tone="green"
          />
        </PatientCard>
      </div>

      {/* Steps + Pain side-by-side */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        <PatientCard className="!p-3.5">
          <div className="flex items-center gap-1.5">
            <IconBadge tone="green" size={28}>
              {I.steps}
            </IconBadge>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--p-ink)" }}
            >
              Steps
            </span>
          </div>
          <div
            className="mt-2 text-[20px] font-bold leading-none"
            style={{ color: "var(--p-ink)" }}
          >
            4,280
          </div>
          <div
            className="mt-1 text-[11.5px] font-medium"
            style={{ color: "var(--p-green-bright)" }}
          >
            {I.trend} +480 vs yesterday
          </div>
          <MiniLine series={stepsSeries} tone="green" />
        </PatientCard>

        <PatientCard className="!p-3.5">
          <div className="flex items-center gap-1.5">
            <IconBadge tone="red" size={28}>
              {I.heart}
            </IconBadge>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--p-ink)" }}
            >
              Pain
            </span>
          </div>
          <div
            className="mt-2 text-[20px] font-bold leading-none"
            style={{ color: "var(--p-ink)" }}
          >
            4 / 10
          </div>
          <div
            className="mt-1 text-[11.5px] font-medium"
            style={{ color: "var(--p-green-bright)" }}
          >
            Down from 7 last week
          </div>
          <MiniLine series={painSeries} tone="red" invert />
        </PatientCard>
      </div>

      {/* Milestones */}
      <div className="px-5 pt-5">
        <div
          className="mb-2 flex items-center gap-1.5 text-[15.5px] font-semibold tracking-[-0.01em]"
          style={{ color: "var(--p-ink)" }}
        >
          <span style={{ color: "var(--p-warn)" }}>{I.sun}</span>
          Milestones
        </div>
        <PatientCard padded={false}>
          {MILESTONES.map((m, i) => (
            <div
              key={m.title}
              className="flex items-center gap-3 px-3.5 py-3"
              style={{
                borderTop: i === 0 ? "0" : "1px solid var(--p-border)",
              }}
            >
              <IconBadge tone={m.done ? "green" : "neutral"} size={36}>
                {m.done ? I.check : <Locked />}
              </IconBadge>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[14px] font-semibold leading-tight"
                  style={{
                    color: m.done ? "var(--p-ink)" : "var(--p-muted)",
                  }}
                >
                  {m.title}
                </div>
                <div
                  className="mt-0.5 text-[11.5px]"
                  style={{ color: "var(--p-muted)" }}
                >
                  {m.sub}
                </div>
              </div>
              {m.done && (
                <span
                  className="patient-chip px-2 py-0.5 text-[10.5px]"
                  style={{ color: "var(--p-green-bright)" }}
                >
                  Done
                </span>
              )}
            </div>
          ))}
        </PatientCard>
      </div>

      <div className="px-5 pt-5">
        <EncouragementCard
          title="Steady progress, week by week."
          subtitle="Keep checking in — your care team is watching with you."
        />
      </div>
    </PatientShell>
  );
}

const MILESTONES: { title: string; sub: string; done?: boolean }[] = [
  { title: "Surgery", sub: "Day 0 — completed", done: true },
  { title: "First walk", sub: "Day 1 — completed", done: true },
  { title: "Stairs without aid", sub: "Day 4 — in progress", done: true },
  { title: "Drive again", sub: "Target: day 14" },
  { title: "Full mobility", sub: "Target: week 6" },
];

function Locked() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function BarChart({
  data,
  max,
  unit,
}: {
  data: { label: string; value: number }[];
  max: number;
  unit?: string;
  tone?: "green";
}) {
  return (
    <div className="mt-4">
      <div className="flex h-32 items-end gap-2">
        {data.map((d, i) => {
          const h = Math.max(6, (d.value / max) * 110);
          const active = i === data.length - 1;
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                className="w-full rounded-full"
                style={{
                  height: h,
                  background: active
                    ? "var(--p-green-bright)"
                    : "var(--p-green-bg-2)",
                  border: active ? "0" : "1px solid var(--p-green-ring)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[11px]"
            style={{
              color:
                i === data.length - 1
                  ? "var(--p-green-bright)"
                  : "var(--p-muted)",
              fontWeight: i === data.length - 1 ? 600 : 400,
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span
          className="text-[11.5px]"
          style={{ color: "var(--p-muted)" }}
        >
          Latest
        </span>
        <span
          className="text-[14px] font-semibold"
          style={{ color: "var(--p-ink)" }}
        >
          {data[data.length - 1].value}
          {unit}
        </span>
      </div>
    </div>
  );
}

function MiniLine({
  series,
  tone,
  invert,
}: {
  series: number[];
  tone: "green" | "red";
  invert?: boolean;
}) {
  const w = 110;
  const h = 32;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const yNorm = (v - min) / range;
      const y = invert ? yNorm * h : (1 - yNorm) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke =
    tone === "green" ? "var(--p-green-bright)" : "var(--p-red)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-9 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={w}
        cy={
          invert
            ? ((series[series.length - 1] - min) / range) * h
            : (1 - (series[series.length - 1] - min) / range) * h
        }
        r="2.6"
        fill={stroke}
      />
    </svg>
  );
}
