"use client";

import { useState } from "react";
import {
  AvatarChip,
  EncouragementCard,
  HaloLogo,
  HeroBackdrop,
  I,
  IconBadge,
  PatientCard,
  PatientShell,
} from "@/components/patient/primitives";

function firstName(name: string) {
  return name.trim().split(",")[0].split(" ")[0] || "there";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PatientRecoveryAssistant({
  user,
}: {
  user: { id: string; name: string };
}) {
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
        <a href="/profile" aria-label="Profile">
          <AvatarChip initials={initials(user.name)} />
        </a>
      </header>

      {/* Heading + hero backdrop */}
      <div className="relative px-5 pt-3">
        <HeroBackdrop />
        <div className="relative z-10">
          <h1
            className="text-[26px] font-bold leading-tight tracking-[-0.02em]"
            style={{ color: "var(--p-ink)" }}
          >
            Recovery assistant
          </h1>
          <p
            className="mt-1 max-w-[220px] text-[13px] leading-snug"
            style={{ color: "var(--p-muted)" }}
          >
            Personalized guidance from your care team and Halo AI.
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4 px-5 pt-5">
        <CareTeamUpdateCard />
        <ActivityPlanCard />
        <MedicationReminderCard />
        <MealPlanCard />
        <EncouragementCard
          title={`You’re healing well, ${firstName(user.name)}.`}
          subtitle="Small steps today lead to big progress."
        />
      </div>
    </PatientShell>
  );
}

// ---------------------------------------------------------------------------
// Feed cards
// ---------------------------------------------------------------------------

function MessageRow({
  avatar,
  sender,
  tag,
  time,
  children,
  reactions,
}: {
  avatar: React.ReactNode;
  sender: string;
  tag?: string;
  time: string;
  children: React.ReactNode;
  reactions?: { thumbs?: number };
}) {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 pt-0.5">{avatar}</div>
      <div className="min-w-0 flex-1">
        <PatientCard className="!p-3.5">
          <div className="flex items-center gap-1.5 text-[12px]">
            <span
              className="font-semibold"
              style={{ color: "var(--p-ink)" }}
            >
              {sender}
            </span>
            {tag && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: "var(--p-muted)" }}
              >
                <span
                  className="inline-block h-1 w-1 rounded-full"
                  style={{ background: "var(--p-green-bright)" }}
                />
                {tag}
              </span>
            )}
            <span
              className="ml-auto text-[11.5px]"
              style={{ color: "var(--p-muted)" }}
            >
              {time}
            </span>
          </div>
          <div className="mt-2">{children}</div>
        </PatientCard>
        {reactions?.thumbs ? (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px]"
            style={{
              background: "var(--p-green-bg)",
              color: "var(--p-green-soft)",
              border: "1px solid var(--p-green-ring)",
            }}
          >
            {I.thumb} {reactions.thumbs}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CareTeamUpdateCard() {
  return (
    <MessageRow
      avatar={<DoctorAvatar />}
      sender="Dr. Lee"
      tag="Care team update"
      time="8:30 AM"
      reactions={{ thumbs: 2 }}
    >
      <div
        className="text-[15px] font-semibold leading-snug"
        style={{ color: "var(--p-ink)" }}
      >
        Dr. Lee reviewed your check-in.
      </div>
      <p
        className="mt-1 text-[13.5px] leading-snug"
        style={{ color: "var(--p-ink-2)" }}
      >
        We adjusted today’s plan for a lighter activity day.
      </p>
    </MessageRow>
  );
}

function ActivityPlanCard() {
  return (
    <MessageRow
      avatar={<AIAvatar />}
      sender="Halo AI"
      tag=""
      time="8:31 AM"
    >
      <div className="flex items-start gap-3">
        <IconBadge tone="green" size={48}>
          {I.walk}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div
            className="text-[12.5px] font-medium"
            style={{ color: "var(--p-muted)" }}
          >
            Your updated activity plan
          </div>
          <div
            className="mt-0.5 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--p-ink)" }}
          >
            Lighter activity day
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[
              "Avoid stairs and heavy lifting",
              "Short, easy walks indoors or outside",
              "Check in again tonight",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-2 text-[13px] leading-snug"
                style={{ color: "var(--p-ink-2)" }}
              >
                <span
                  className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: "var(--p-green-bright)" }}
                />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <a
        href="/progress"
        className="mt-3 flex items-center gap-2 border-t pt-3 text-[13.5px] font-semibold"
        style={{
          borderColor: "var(--p-border)",
          color: "var(--p-green-bright)",
        }}
      >
        {I.calendar}
        View full plan
        <span className="ml-auto" style={{ color: "var(--p-muted-2)" }}>
          {I.chevron}
        </span>
      </a>
    </MessageRow>
  );
}

function MedicationReminderCard() {
  return (
    <MessageRow
      avatar={<AIAvatar />}
      sender="Halo AI"
      tag=""
      time="8:31 AM"
    >
      <div className="flex items-start gap-3">
        <IconBadge tone="purple" size={48}>
          {I.pill}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div
            className="text-[12.5px] font-medium"
            style={{ color: "var(--p-muted)" }}
          >
            Medication reminder
          </div>
          <div
            className="mt-0.5 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--p-ink)" }}
          >
            Acetaminophen 500 mg
          </div>
          <div
            className="mt-1.5 flex items-center gap-1.5 text-[13px]"
            style={{ color: "var(--p-ink-2)" }}
          >
            <span style={{ color: "var(--p-muted-2)" }}>{I.clock}</span>
            Take 1 tablet
            <span style={{ color: "var(--p-muted-2)" }}>•</span>
            Every 6 hours
          </div>
          <div
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--p-muted)" }}
          >
            Next dose due: 2:30 PM
          </div>
        </div>
      </div>
      <DoseButton />
    </MessageRow>
  );
}

function DoseButton() {
  const [taken, setTaken] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setTaken((v) => !v)}
      className="patient-cta mt-3 flex h-11 w-full items-center justify-center gap-2 text-[14px]"
      style={
        taken
          ? {
              background: "var(--p-surface-2)",
              color: "var(--p-green-soft)",
              border: "1px solid var(--p-green-ring)",
            }
          : undefined
      }
    >
      {I.checkCircle}
      {taken ? "Logged" : "I’ve taken this dose"}
    </button>
  );
}

function MealPlanCard() {
  const meals: { name: string; sub: string; img: string }[] = [
    {
      name: "Greek yogurt bowl",
      sub: "Greek yogurt, berries, almonds, honey",
      img: "yogurt",
    },
    {
      name: "Lemon herb chicken & quinoa",
      sub: "With roasted vegetables",
      img: "chicken",
    },
    {
      name: "Cottage cheese & pineapple",
      sub: "With chia seeds",
      img: "cottage",
    },
  ];
  return (
    <MessageRow
      avatar={<AIAvatar />}
      sender="Halo AI"
      tag=""
      time="8:31 AM"
    >
      <div className="flex items-start gap-3">
        <IconBadge tone="orange" size={48}>
          {I.bowl}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div
            className="text-[12.5px] font-medium"
            style={{ color: "var(--p-muted)" }}
          >
            Today’s recovery meals
          </div>
          <div
            className="mt-0.5 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--p-ink)" }}
          >
            High-protein meal plan
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        {meals.map((m, i) => (
          <div
            key={m.name}
            className="flex items-center gap-3 py-2.5"
            style={{
              borderTop: i === 0 ? "0" : "1px solid var(--p-border)",
            }}
          >
            <MealThumb kind={m.img} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[13.5px] font-semibold"
                style={{ color: "var(--p-ink)" }}
              >
                {m.name}
              </div>
              <div
                className="mt-0.5 text-[11.5px]"
                style={{ color: "var(--p-muted)" }}
              >
                {m.sub}
              </div>
            </div>
            <span style={{ color: "var(--p-muted-2)" }}>{I.chevron}</span>
          </div>
        ))}
      </div>

      <a
        href="/progress"
        className="mt-2 flex items-center gap-2 border-t pt-3 text-[13.5px] font-semibold"
        style={{
          borderColor: "var(--p-border)",
          color: "var(--p-green-bright)",
        }}
      >
        {I.book}
        View more meal ideas
        <span className="ml-auto" style={{ color: "var(--p-muted-2)" }}>
          {I.chevron}
        </span>
      </a>
    </MessageRow>
  );
}

// ---------------------------------------------------------------------------
// Avatars + meal thumbs
// ---------------------------------------------------------------------------

function DoctorAvatar() {
  return (
    <span
      aria-hidden
      className="inline-grid h-10 w-10 place-items-center overflow-hidden rounded-full"
      style={{
        background:
          "radial-gradient(circle at 40% 35%, #f1d4b4, #b97e58 70%, #5a3220)",
        border: "1px solid var(--p-border)",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5 21c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5z" />
      </svg>
    </span>
  );
}

function AIAvatar() {
  return (
    <span
      aria-hidden
      className="inline-grid h-10 w-10 place-items-center rounded-full"
      style={{
        background: "var(--p-warn-bg)",
        border: "1px solid var(--p-border)",
        color: "var(--p-gold)",
      }}
    >
      {I.sparkle}
    </span>
  );
}

function MealThumb({ kind }: { kind: string }) {
  // Tiny illustrative thumb — uses css-only gradients so we don't need
  // image assets for the demo.
  const palettes: Record<string, [string, string, string]> = {
    yogurt: ["#f5edd9", "#f0d990", "#c4a45a"],
    chicken: ["#f1e1c2", "#d8a86a", "#7a4f25"],
    cottage: ["#fbf3df", "#f0d385", "#a17a35"],
  };
  const c = palettes[kind] ?? palettes.yogurt;
  return (
    <span
      className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg, var(--p-surface-2), var(--p-surface-3))",
        border: "1px solid var(--p-border)",
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40">
        <ellipse cx="20" cy="26" rx="14" ry="6" fill={c[0]} />
        <ellipse cx="20" cy="22" rx="14" ry="6" fill={c[1]} />
        <circle cx="14" cy="20" r="2.5" fill={c[2]} />
        <circle cx="22" cy="19" r="2" fill={c[2]} />
        <circle cx="26" cy="22" r="2" fill={c[2]} />
      </svg>
    </span>
  );
}
