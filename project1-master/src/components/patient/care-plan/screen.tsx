"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AvatarChip,
  HaloLogo,
  I,
  PatientShell,
} from "@/components/patient/primitives";
import { CARE_TEAMS, type CareTeam } from "@/components/patient/care-plan/care-teams";
import {
  renderPlanComponent,
} from "@/components/patient/care-plan/tambo-components";
import { HaloTamboProvider } from "@/lib/tambo";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PatientCarePlanScreen({
  user,
}: {
  user: { id: string; name: string };
}) {
  return (
    <HaloTamboProvider userId={user.id}>
      <CarePlanContent user={user} />
    </HaloTamboProvider>
  );
}

function CarePlanContent({
  user,
}: {
  user: { id: string; name: string };
}) {
  const [activeId, setActiveId] = useState<string>(CARE_TEAMS[0].id);
  const team = useMemo<CareTeam>(
    () => CARE_TEAMS.find((t) => t.id === activeId) ?? CARE_TEAMS[0],
    [activeId],
  );

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

      {/* Compact heading */}
      <div className="px-5 pt-3">
        <h1
          className="text-[24px] font-bold leading-tight tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          Today’s plan
        </h1>
      </div>

      {/* Care team switcher — only when the patient is on more than one team.
          A single-team patient doesn't need a switcher; it's just noise. */}
      {CARE_TEAMS.length > 1 ? (
        <div className="px-5 pt-3">
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {CARE_TEAMS.map((t) => {
              const active = t.id === activeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className="flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition"
                  style={{
                    background: active
                      ? "var(--p-green-bg-2)"
                      : "var(--p-surface)",
                    color: active ? "var(--p-green-bright)" : "var(--p-ink-2)",
                    border: `1px solid ${active ? "var(--p-green-ring)" : "var(--p-border)"}`,
                  }}
                >
                  <TeamDot tint={t.lead.tint} active={active} />
                  {t.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Ask Halo AI CTA — the entry point to dynamic recommendations
          (groups nearby, recovery products, alternate meal ideas). Lives
          above the static plan so it's the first thing the patient sees. */}
      <div className="px-5 pt-4">
        <Link
          href="/ai"
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 active:scale-[0.99] transition"
          style={{
            background: "var(--p-green-bg-2)",
            border: "1px solid var(--p-green-ring)",
          }}
        >
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            style={{
              background: "var(--p-green-bg)",
              color: "var(--p-green-bright)",
            }}
          >
            {I.sparkle}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[14.5px] font-bold leading-tight"
              style={{ color: "var(--p-ink)" }}
            >
              Ask Halo AI
            </div>
            <div
              className="mt-0.5 text-[12px] leading-snug"
              style={{ color: "var(--p-muted)" }}
            >
              Get personalized tips, groups, and products to stick to your plan.
            </div>
          </div>
          <span style={{ color: "var(--p-green-bright)" }}>{I.chevron}</span>
        </Link>
      </div>

      {/* Static plan from your doctor — kept short on purpose. */}
      <div className="flex flex-col gap-3 px-5 pt-4 pb-6">
        {team.messages.map((m) => (
          <div key={m.id}>{renderPlanComponent(m.component, m.props)}</div>
        ))}
      </div>
    </PatientShell>
  );
}

function TeamDot({
  tint,
  active,
}: {
  tint: "ochre" | "green" | "purple";
  active?: boolean;
}) {
  const colors: Record<typeof tint, string> = {
    ochre: "#d4a847",
    green: "var(--p-green-bright)",
    purple: "#a884db",
  };
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: colors[tint],
        boxShadow: active ? `0 0 0 3px ${colors[tint]}33` : undefined,
      }}
    />
  );
}

