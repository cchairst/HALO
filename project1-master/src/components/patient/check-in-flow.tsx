"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitTaskCompletion } from "@/app/actions";
import {
  AvatarChip,
  BackButton,
  EncouragementCard,
  HaloLogo,
  I,
  IconBadge,
  PatientCard,
  PatientShell,
} from "@/components/patient/primitives";

const STEPS = ["Incision photo", "Daily check-in", "How you’re feeling", "Review"] as const;
const TOTAL = STEPS.length;

type CheckInState = {
  incisionPhoto: boolean;
  videoRecorded: boolean;
  medsTaken: "yes" | "missed" | null;
  pain: number; // 1..10
  sleep: "poor" | "fair" | "good" | "great" | null;
  mood: "low" | "ok" | "good" | "great" | null;
  notes: string;
};

const INITIAL: CheckInState = {
  incisionPhoto: false,
  videoRecorded: false,
  medsTaken: "yes",
  pain: 4,
  sleep: "good",
  mood: "good",
  notes: "",
};

export function PatientCheckInFlow({
  user,
  taskId,
}: {
  user: { id: string; name: string };
  taskId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(2); // image shows step 2 of 4
  const [state, setState] = useState<CheckInState>(INITIAL);
  const [submitPending, startSubmit] = useTransition();

  function next() {
    if (step >= TOTAL) {
      startSubmit(async () => {
        // Only persist when this check-in was opened for a specific homework
        // task. Standalone /check-in visits stay client-only so we don't
        // create orphan rows.
        if (taskId) {
          const fd = new FormData();
          fd.append("taskId", taskId);
          fd.append("painScore", String(state.pain));
          if (state.notes) fd.append("note", state.notes);
          if (state.incisionPhoto) {
            // Stand-in for an actual upload pipeline. Marks "photo attached"
            // on the doctor's view without requiring storage wiring.
            fd.append("photoUrl", "captured://incision-photo");
          }
          await submitTaskCompletion(fd);
        }
        router.push("/dashboard");
      });
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    if (step <= 1) {
      router.push("/dashboard");
      return;
    }
    setStep((s) => s - 1);
  }

  function update<K extends keyof CheckInState>(key: K, val: CheckInState[K]) {
    setState((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <PatientShell>
      {/* Header — center logo, back arrow + avatar */}
      <header className="relative flex items-center px-5 pt-4 pb-2">
        <BackButton href="/dashboard" />
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <HaloLogo size={26} />
          <span
            className="text-[22px] font-semibold tracking-[-0.02em]"
            style={{ color: "var(--p-ink)" }}
          >
            Halo
          </span>
        </div>
        <div className="ml-auto">
          <AvatarChip initials={initials(user.name)} />
        </div>
      </header>

      {/* Title + step pill */}
      <div className="relative px-5 pt-2">
        <h1
          className="text-[28px] font-bold tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          Today’s check-in
        </h1>
        <div
          className="mt-1 text-[13px]"
          style={{ color: "var(--p-muted)" }}
        >
          Step {step} of {TOTAL}
        </div>

        {/* Progress segments */}
        <div className="mt-3 flex gap-2">
          {Array.from({ length: TOTAL }).map((_, i) => {
            const active = i + 1 === step;
            const done = i + 1 < step;
            return (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  background: done
                    ? "var(--p-green-soft)"
                    : active
                      ? "var(--p-green-bright)"
                      : "var(--p-border-strong)",
                  opacity: active ? 1 : done ? 0.85 : 0.4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="patient-fade-in flex flex-col gap-3 px-5 pt-5">
        {step === 1 && <StepIncisionPhoto state={state} update={update} />}
        {step === 2 && <StepDaily state={state} update={update} />}
        {step === 3 && <StepFeeling state={state} update={update} />}
        {step === 4 && <StepReview state={state} />}

        <EncouragementCard
          title="Small steps today lead to big progress."
          subtitle="We’re cheering you on!"
        />
      </div>

      {/* Footer actions — sticky bottom row */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
        style={{
          background:
            "linear-gradient(to top, var(--p-bg) 60%, transparent 100%)",
        }}
      >
        <div className="mx-auto flex w-[min(94vw,440px)] items-center gap-3 px-3 pb-4 pt-3">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1.5 px-1 text-[14px] font-medium"
            style={{ color: "var(--p-ink-2)" }}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{
                background: "var(--p-surface)",
                border: "1px solid var(--p-border)",
                color: "var(--p-ink)",
              }}
            >
              {I.cancel}
            </span>
            Cancel
          </button>
          <button
            type="button"
            onClick={next}
            disabled={submitPending}
            className="patient-cta ml-auto flex h-12 flex-1 items-center justify-center gap-2 px-4 text-[15px] disabled:opacity-60"
          >
            {submitPending
              ? "Submitting…"
              : step === TOTAL
                ? "Submit"
                : "Next"}
            {step !== TOTAL && <span aria-hidden>{I.chevron}</span>}
          </button>
        </div>
      </div>
    </PatientShell>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Incision photo
// ---------------------------------------------------------------------------
function StepIncisionPhoto({
  state,
  update,
}: {
  state: CheckInState;
  update: <K extends keyof CheckInState>(k: K, v: CheckInState[K]) => void;
}) {
  return (
    <PatientCard>
      <h2
        className="text-[19px] font-bold tracking-[-0.01em]"
        style={{ color: "var(--p-ink)" }}
      >
        Take a photo of your incision
      </h2>
      <div
        className="mt-1 flex items-start gap-1.5 text-[12.5px]"
        style={{ color: "var(--p-green-soft)" }}
      >
        <span className="mt-0.5">{I.info}</span>
        <p>
          Hold your phone steady, in good light. Your care team only sees this
          photo.
        </p>
      </div>

      <button
        type="button"
        onClick={() => update("incisionPhoto", !state.incisionPhoto)}
        className="mt-4 relative grid h-[240px] w-full place-items-center overflow-hidden rounded-2xl"
        style={{
          background: "var(--p-surface-2)",
          border: "1.5px dashed var(--p-border-strong)",
        }}
      >
        <div className="text-center">
          <IconBadge tone="blue" size={56}>
            {I.camera}
          </IconBadge>
          <div
            className="mt-2 text-[14px] font-semibold"
            style={{ color: "var(--p-ink)" }}
          >
            {state.incisionPhoto ? "Photo captured" : "Tap to take photo"}
          </div>
          <div
            className="mt-0.5 text-[11.5px]"
            style={{ color: "var(--p-muted)" }}
          >
            Front-facing camera works best
          </div>
        </div>
      </button>
    </PatientCard>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Walking video + meds + pain + sleep (matches reference image)
// ---------------------------------------------------------------------------
function StepDaily({
  state,
  update,
}: {
  state: CheckInState;
  update: <K extends keyof CheckInState>(k: K, v: CheckInState[K]) => void;
}) {
  return (
    <>
      {/* Walking video */}
      <PatientCard>
        <h2
          className="text-[19px] font-bold tracking-[-0.01em]"
          style={{ color: "var(--p-ink)" }}
        >
          Record your 30-second walking video
        </h2>
        <div
          className="mt-1 flex items-start gap-1.5 text-[12.5px]"
          style={{ color: "var(--p-green-soft)" }}
        >
          <span className="mt-0.5">{I.info}</span>
          <p>This helps your care team understand how you’re healing.</p>
        </div>

        <div
          className="relative mt-3 h-[260px] w-full overflow-hidden rounded-2xl"
          style={{
            background:
              "linear-gradient(180deg, #678a64 0%, #4a6c50 60%, #355742 100%)",
          }}
        >
          {/* Stylized garden path SVG (placeholder for camera preview) */}
          <svg
            viewBox="0 0 320 260"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="sky" cx="0.5" cy="0.2" r="0.8">
                <stop offset="0" stopColor="#dceac1" />
                <stop offset="1" stopColor="#7ea36a" />
              </radialGradient>
              <linearGradient id="path-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c9b78f" />
                <stop offset="1" stopColor="#988358" />
              </linearGradient>
            </defs>
            <rect width="320" height="260" fill="url(#sky)" />
            <path d="M120 260 L 160 90 L 200 260 Z" fill="url(#path-grad)" />
            <path d="M40 260 Q 90 160 130 100 Q 105 170 80 260 Z" fill="#3f6c49" opacity="0.9" />
            <path d="M280 260 Q 230 160 190 100 Q 215 170 240 260 Z" fill="#3f6c49" opacity="0.9" />
            <path d="M0 260 Q 60 200 120 240 L 0 260 Z" fill="#2c4f37" />
            <path d="M320 260 Q 260 200 200 240 L 320 260 Z" fill="#2c4f37" />
            <circle cx="160" cy="115" r="14" fill="#e8e2da" />
            <path d="M148 130 Q 160 122 172 130 L 178 200 Q 160 210 142 200 Z" fill="#cfd0d2" />
            <path d="M150 200 L 144 240 L 156 240 Z" fill="#3d3a36" />
            <path d="M170 200 L 164 240 L 176 240 Z" fill="#3d3a36" />
          </svg>

          <div
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <span style={{ color: "var(--p-green-bright)" }}>{I.video}</span>
            30s
          </div>
          <button
            type="button"
            aria-label="Flip camera"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full"
            style={{
              background: "rgba(0,0,0,0.45)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {I.rotate}
          </button>

          <button
            type="button"
            onClick={() => update("videoRecorded", !state.videoRecorded)}
            aria-label="Record"
            className="absolute bottom-3 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full"
            style={{ background: "rgba(0,0,0,0.0)" }}
          >
            <span
              className="grid h-16 w-16 place-items-center rounded-full"
              style={{
                border: "3px solid white",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="block h-10 w-10 rounded-full"
                style={{ background: "#ea4747" }}
              />
            </span>
          </button>
        </div>
      </PatientCard>

      {/* Meds */}
      <PatientCard className="!py-3.5">
        <div className="flex items-center gap-3">
          <IconBadge tone="green" size={42}>
            {I.pill}
          </IconBadge>
          <div
            className="text-[13.5px] font-semibold leading-tight"
            style={{ color: "var(--p-ink)" }}
          >
            Did you take your<br />medications today?
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Choice
              selected={state.medsTaken === "yes"}
              onClick={() => update("medsTaken", "yes")}
              tone="primary"
            >
              Yes
            </Choice>
            <Choice
              selected={state.medsTaken === "missed"}
              onClick={() => update("medsTaken", "missed")}
            >
              Missed one
            </Choice>
          </div>
        </div>
      </PatientCard>

      {/* Pain */}
      <PatientCard>
        <div className="flex items-start gap-3">
          <IconBadge tone="purple" size={42}>
            {I.heart}
          </IconBadge>
          <div className="min-w-0 flex-1">
            <div
              className="text-[14.5px] font-semibold"
              style={{ color: "var(--p-ink)" }}
            >
              How is your pain?
            </div>
            <div
              className="mt-0.5 text-[11.5px]"
              style={{ color: "var(--p-muted)" }}
            >
              1 = none <span style={{ color: "var(--p-muted-2)" }}>•</span> 10 =
              worst
            </div>
          </div>
        </div>

        <PainSlider
          value={state.pain}
          onChange={(v) => update("pain", v)}
        />
      </PatientCard>

      {/* Sleep */}
      <PatientCard className="!py-3.5">
        <div className="flex items-center gap-3">
          <IconBadge tone="purple" size={42}>
            {I.moon}
          </IconBadge>
          <div
            className="text-[14.5px] font-semibold"
            style={{ color: "var(--p-ink)" }}
          >
            How did you sleep?
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(["poor", "fair", "good", "great"] as const).map((opt) => (
            <Choice
              key={opt}
              selected={state.sleep === opt}
              onClick={() => update("sleep", opt)}
              outlined
            >
              {opt[0].toUpperCase() + opt.slice(1)}
            </Choice>
          ))}
        </div>
      </PatientCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — How you're feeling
// ---------------------------------------------------------------------------
function StepFeeling({
  state,
  update,
}: {
  state: CheckInState;
  update: <K extends keyof CheckInState>(k: K, v: CheckInState[K]) => void;
}) {
  const moods: { id: CheckInState["mood"]; emoji: string; label: string }[] = [
    { id: "low", emoji: "😔", label: "Low" },
    { id: "ok", emoji: "🙂", label: "Okay" },
    { id: "good", emoji: "😊", label: "Good" },
    { id: "great", emoji: "😄", label: "Great" },
  ];
  return (
    <>
      <PatientCard>
        <h2
          className="text-[18px] font-bold tracking-[-0.01em]"
          style={{ color: "var(--p-ink)" }}
        >
          How are you feeling overall?
        </h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {moods.map((m) => {
            const selected = state.mood === m.id;
            return (
              <button
                key={m.id ?? "x"}
                type="button"
                onClick={() => update("mood", m.id)}
                className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[12px] font-semibold"
                style={{
                  background: selected
                    ? "var(--p-green-bg-2)"
                    : "var(--p-surface-2)",
                  border: `1px solid ${selected ? "var(--p-green-ring)" : "var(--p-border)"}`,
                  color: selected ? "var(--p-green-soft)" : "var(--p-ink)",
                }}
              >
                <span className="text-[26px] leading-none">{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </PatientCard>

      <PatientCard>
        <div
          className="text-[14.5px] font-semibold"
          style={{ color: "var(--p-ink)" }}
        >
          Anything you want to share with your care team?
        </div>
        <textarea
          placeholder="Optional — soreness, mood, swelling…"
          value={state.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="mt-2 w-full rounded-2xl p-3 text-[14px] outline-none"
          style={{
            background: "var(--p-surface-2)",
            border: "1px solid var(--p-border)",
            color: "var(--p-ink)",
            minHeight: 90,
            resize: "vertical",
          }}
          rows={4}
        />
      </PatientCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Review
// ---------------------------------------------------------------------------
function StepReview({ state }: { state: CheckInState }) {
  const rows: { label: string; value: string }[] = [
    { label: "Incision photo", value: state.incisionPhoto ? "Captured" : "Skipped" },
    { label: "Walking video", value: state.videoRecorded ? "Recorded" : "Skipped" },
    {
      label: "Medications",
      value:
        state.medsTaken === "yes"
          ? "Taken on time"
          : state.medsTaken === "missed"
            ? "Missed one"
            : "—",
    },
    { label: "Pain", value: `${state.pain} / 10` },
    {
      label: "Sleep",
      value: state.sleep ? state.sleep[0].toUpperCase() + state.sleep.slice(1) : "—",
    },
    {
      label: "Mood",
      value: state.mood ? state.mood[0].toUpperCase() + state.mood.slice(1) : "—",
    },
  ];
  return (
    <>
      <PatientCard>
        <h2
          className="text-[19px] font-bold tracking-[-0.01em]"
          style={{ color: "var(--p-ink)" }}
        >
          Looks good — ready to send?
        </h2>
        <p
          className="mt-1 text-[12.5px]"
          style={{ color: "var(--p-muted)" }}
        >
          Your care team will review your check-in within a few hours.
        </p>
        <div className="mt-3 flex flex-col">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className="flex items-center justify-between py-2.5"
              style={{ borderTop: i === 0 ? "0" : "1px solid var(--p-border)" }}
            >
              <span
                className="text-[13.5px]"
                style={{ color: "var(--p-muted)" }}
              >
                {r.label}
              </span>
              <span
                className="text-[14px] font-semibold"
                style={{ color: "var(--p-ink)" }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
        {state.notes && (
          <div
            className="mt-3 rounded-2xl p-3 text-[13px]"
            style={{
              background: "var(--p-surface-2)",
              border: "1px solid var(--p-border)",
              color: "var(--p-ink-2)",
            }}
          >
            “{state.notes}”
          </div>
        )}
      </PatientCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pain slider — 1..10 with the active green track + value bubble
// ---------------------------------------------------------------------------
function PainSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  // Position bubble proportionally
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="mt-3 px-1">
      <div className="relative h-3">
        <div
          className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{ background: "var(--p-border-strong)" }}
        />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{
            background: "var(--p-green-bright)",
            left: 0,
            width: `${pct}%`,
          }}
        />
        <span
          className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[12px] font-bold"
          style={{
            top: "50%",
            left: `${pct}%`,
            background: "var(--p-green-bright)",
            color: "var(--p-on-green)",
            boxShadow: "0 2px 6px rgba(31,107,59,0.3)",
          }}
        >
          {value}
        </span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 z-10 w-full cursor-pointer appearance-none bg-transparent opacity-0"
          aria-label="Pain rating"
        />
      </div>
      <div
        className="mt-2 flex justify-between text-[11px]"
        style={{ color: "var(--p-muted)" }}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <span key={n} style={{ width: 12, textAlign: "center" }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function Choice({
  children,
  selected,
  onClick,
  tone,
  outlined,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  tone?: "primary";
  outlined?: boolean;
}) {
  // Three visual variants:
  // - selected + primary tone => filled green
  // - selected + outlined tone => green-outlined transparent
  // - selected (default) => filled green (compact)
  // - unselected => bordered surface
  const isFilled = selected && tone === "primary";
  const isOutlinedSelected = selected && outlined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
      style={{
        background: isFilled
          ? "var(--p-green-strong)"
          : isOutlinedSelected
            ? "transparent"
            : "var(--p-surface)",
        color: isFilled
          ? "var(--p-on-green)"
          : isOutlinedSelected
            ? "var(--p-green-soft)"
            : "var(--p-ink)",
        border: isFilled
          ? "1px solid var(--p-green-strong)"
          : isOutlinedSelected
            ? "1.5px solid var(--p-green-soft)"
            : "1px solid var(--p-border-strong)",
        minHeight: 36,
      }}
    >
      {children}
    </button>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
