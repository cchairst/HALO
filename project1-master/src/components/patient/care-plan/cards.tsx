"use client";

import { z } from "zod";
import { I, IconBadge, PatientCard } from "@/components/patient/primitives";

// ---------------------------------------------------------------------------
// Plan cards — these are the generative-UI primitives the AI streams. Each
// card exports a Zod prop schema so it can be registered with Tambo as a
// `TamboComponent`. The schemas are also used to validate seed data at the
// border so the demo and live agent both go through the same shape.
// ---------------------------------------------------------------------------

const toneEnum = z.enum(["green", "purple", "blue", "red", "ochre", "gold"]);

// ----- Care team update -----------------------------------------------------

export const CareTeamUpdateProps = z.object({
  doctorName: z.string().describe("Care team member who posted the update"),
  headline: z.string().describe("Short headline sentence"),
  body: z.string().describe("One- to two-sentence body of the update"),
  tone: toneEnum.optional().default("ochre"),
});
export type CareTeamUpdateProps = z.infer<typeof CareTeamUpdateProps>;

export function CareTeamUpdateCard({
  doctorName,
  headline,
  body,
  tone = "ochre",
}: CareTeamUpdateProps) {
  // DoctorAvatar only knows three tints; coerce anything else to ochre.
  const avatarTone: "green" | "purple" | "ochre" =
    tone === "green" || tone === "purple" ? tone : "ochre";
  return (
    <PatientCard className="!p-3.5">
      <div className="flex items-start gap-3">
        <DoctorAvatar tone={avatarTone} />
        <div className="min-w-0 flex-1">
          <div
            className="text-[15px] font-semibold leading-snug"
            style={{ color: "var(--p-ink)" }}
          >
            {headline}
          </div>
          <p
            className="mt-1 text-[13.5px] leading-snug"
            style={{ color: "var(--p-ink-2)" }}
          >
            {body}
          </p>
          <div
            className="mt-2 text-[11.5px] font-medium"
            style={{ color: "var(--p-muted)" }}
          >
            {doctorName} • Care team
          </div>
        </div>
      </div>
    </PatientCard>
  );
}

// ----- Activity plan --------------------------------------------------------

export const ActivityPlanProps = z.object({
  title: z.string().describe("Activity plan headline"),
  subtitle: z.string().optional().describe("Small label above the title"),
  bullets: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe("Concrete actions the patient should take"),
  cta: z.string().optional().describe("Call-to-action label on the footer"),
  tone: toneEnum.optional().default("green"),
});
export type ActivityPlanProps = z.infer<typeof ActivityPlanProps>;

export function ActivityPlanCard({
  title,
  subtitle,
  bullets,
  cta,
}: ActivityPlanProps) {
  return (
    <PatientCard className="!p-3.5">
      <div className="flex items-start gap-3">
        <IconBadge tone="green" size={48}>
          {I.walk}
        </IconBadge>
        <div className="min-w-0 flex-1">
          {subtitle && (
            <div
              className="text-[12.5px] font-medium"
              style={{ color: "var(--p-muted)" }}
            >
              {subtitle}
            </div>
          )}
          <div
            className="mt-0.5 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--p-ink)" }}
          >
            {title}
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {bullets.map((t) => (
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
      {cta && (
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-2 border-t pt-3 text-[13.5px] font-semibold"
          style={{
            borderColor: "var(--p-border)",
            color: "var(--p-green-bright)",
          }}
        >
          {I.calendar}
          {cta}
          <span className="ml-auto" style={{ color: "var(--p-muted-2)" }}>
            {I.chevron}
          </span>
        </button>
      )}
    </PatientCard>
  );
}

// ----- Medication reminder --------------------------------------------------

export const MedicationReminderProps = z.object({
  name: z.string().describe("Medication name and strength"),
  dosage: z.string().describe("How much to take per dose"),
  schedule: z.string().describe("How often to take it"),
  nextDoseAt: z.string().describe("When the next dose is due"),
  tone: toneEnum.optional().default("purple"),
});
export type MedicationReminderProps = z.infer<typeof MedicationReminderProps>;

export function MedicationReminderCard({
  name,
  dosage,
  schedule,
  nextDoseAt,
}: MedicationReminderProps) {
  return (
    <PatientCard className="!p-3.5">
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
            {name}
          </div>
          <div
            className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]"
            style={{ color: "var(--p-ink-2)" }}
          >
            <span style={{ color: "var(--p-muted-2)" }}>{I.clock}</span>
            {dosage}
            <span style={{ color: "var(--p-muted-2)" }}>•</span>
            {schedule}
          </div>
          <div
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--p-muted)" }}
          >
            Next dose due: {nextDoseAt}
          </div>
        </div>
      </div>
      <DoseConfirmButton />
    </PatientCard>
  );
}

// ----- Meal plan ------------------------------------------------------------

const mealKindEnum = z.enum(["yogurt", "chicken", "cottage"]);

export const MealPlanProps = z.object({
  title: z.string().describe("Meal plan headline"),
  subtitle: z.string().optional().describe("Small label above the title"),
  meals: z
    .array(
      z.object({
        name: z.string(),
        sub: z.string(),
        kind: mealKindEnum.optional(),
      }),
    )
    .min(1)
    .max(6),
});
export type MealPlanProps = z.infer<typeof MealPlanProps>;

export function MealPlanCard({ title, subtitle, meals }: MealPlanProps) {
  return (
    <PatientCard className="!p-3.5">
      <div className="flex items-start gap-3">
        <IconBadge tone="orange" size={48}>
          {I.bowl}
        </IconBadge>
        <div className="min-w-0 flex-1">
          {subtitle && (
            <div
              className="text-[12.5px] font-medium"
              style={{ color: "var(--p-muted)" }}
            >
              {subtitle}
            </div>
          )}
          <div
            className="mt-0.5 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--p-ink)" }}
          >
            {title}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        {meals.map((m, i) => (
          <div
            key={`${m.name}-${i}`}
            className="flex items-center gap-3 py-2.5"
            style={{
              borderTop: i === 0 ? "0" : "1px solid var(--p-border)",
            }}
          >
            <MealThumb kind={m.kind ?? "yogurt"} />
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

      <button
        type="button"
        className="mt-2 flex w-full items-center gap-2 border-t pt-3 text-[13.5px] font-semibold"
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
      </button>
    </PatientCard>
  );
}

// ----- Milestone ------------------------------------------------------------

export const MilestoneProps = z.object({
  title: z.string(),
  sub: z.string(),
  completed: z.boolean().optional().default(false),
});
export type MilestoneProps = z.infer<typeof MilestoneProps>;

export function MilestoneCard({ title, sub, completed }: MilestoneProps) {
  return (
    <PatientCard className="!p-3.5">
      <div className="flex items-center gap-3">
        <IconBadge tone={completed ? "green" : "neutral"} size={44}>
          {completed ? I.checkCircle : I.sparkle}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div
            className="text-[12.5px] font-medium"
            style={{ color: "var(--p-muted)" }}
          >
            Milestone
          </div>
          <div
            className="mt-0.5 text-[16px] font-bold tracking-[-0.01em]"
            style={{ color: "var(--p-ink)" }}
          >
            {title}
          </div>
          <div
            className="mt-1 text-[12.5px]"
            style={{ color: "var(--p-muted)" }}
          >
            {sub}
          </div>
        </div>
        {completed && (
          <span
            className="patient-chip px-2.5 py-1 text-[11px]"
            style={{ color: "var(--p-green-bright)" }}
          >
            Reached
          </span>
        )}
      </div>
    </PatientCard>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents shared by the cards above
// ---------------------------------------------------------------------------

function DoctorAvatar({ tone }: { tone: "green" | "purple" | "ochre" }) {
  const gradient = {
    ochre: "radial-gradient(circle at 40% 35%, #f1d4b4, #b97e58 70%, #5a3220)",
    green: "radial-gradient(circle at 40% 35%, #b9d6b0, #5a8a55 70%, #2c4f37)",
    purple: "radial-gradient(circle at 40% 35%, #d8c8ee, #8a6dc9 70%, #432f70)",
  }[tone];
  return (
    <span
      aria-hidden
      className="inline-grid h-10 w-10 place-items-center overflow-hidden rounded-full"
      style={{ background: gradient, border: "1px solid var(--p-border)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5 21c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5z" />
      </svg>
    </span>
  );
}

function MealThumb({ kind }: { kind: "yogurt" | "chicken" | "cottage" }) {
  const palettes: Record<typeof kind, [string, string, string]> = {
    yogurt: ["#f5edd9", "#f0d990", "#c4a45a"],
    chicken: ["#f1e1c2", "#d8a86a", "#7a4f25"],
    cottage: ["#fbf3df", "#f0d385", "#a17a35"],
  };
  const c = palettes[kind];
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

function DoseConfirmButton() {
  return (
    <button
      type="button"
      className="patient-cta mt-3 flex h-11 w-full items-center justify-center gap-2 text-[14px]"
    >
      {I.checkCircle}
      I’ve taken this dose
    </button>
  );
}

// ----- Nearby recommendations ----------------------------------------------
// Local places matched to the patient's recovery context: PT clinics,
// walking groups, recovery-friendly yoga studios, mobility-aid rental shops.
// Cards are tappable so the demo can pretend a real Maps deeplink would fire.

export const NearbyPlacesProps = z.object({
  title: z.string().describe("Top label, e.g. 'Recovery spots near you'"),
  subtitle: z
    .string()
    .optional()
    .describe("Small body text under the title"),
  places: z
    .array(
      z.object({
        name: z.string(),
        kind: z
          .enum(["pt_clinic", "walking_group", "yoga", "pool", "pharmacy", "store"])
          .describe("Category of the place — drives the icon tint"),
        distance: z
          .string()
          .describe("Pre-formatted, e.g. '0.8 mi', '12 min walk'"),
        detail: z
          .string()
          .optional()
          .describe("One-line description, hours, or matching reason"),
        cta: z
          .string()
          .optional()
          .describe("Action label, defaults to 'Open in Maps'"),
      }),
    )
    .min(1)
    .max(5),
  tone: toneEnum.optional().default("green"),
});
export type NearbyPlacesProps = z.infer<typeof NearbyPlacesProps>;

export function NearbyPlacesCard({
  title,
  subtitle,
  places,
  tone = "green",
}: NearbyPlacesProps) {
  return (
    <PatientCard className="!p-3.5">
      <div className="flex items-center gap-2">
        <IconBadge tone={coerceBadgeTone(tone)} size={34}>
          {I.steps}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div
            className="text-[14.5px] font-semibold leading-tight"
            style={{ color: "var(--p-ink)" }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              className="mt-0.5 text-[12px]"
              style={{ color: "var(--p-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <span className="patient-chip px-2 py-0.5 text-[10.5px]">
          {I.sparkle} Nearby
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {places.map((p) => (
          <button
            key={p.name}
            type="button"
            className="flex items-start gap-3 rounded-2xl px-3 py-2.5 text-left"
            style={{
              background: "var(--p-surface-2)",
              border: "1px solid var(--p-border)",
            }}
          >
            <PlaceKindBadge kind={p.kind} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="truncate text-[13.5px] font-semibold"
                  style={{ color: "var(--p-ink)" }}
                >
                  {p.name}
                </div>
                <div
                  className="shrink-0 text-[11px] font-medium"
                  style={{ color: "var(--p-green-bright)" }}
                >
                  {p.distance}
                </div>
              </div>
              {p.detail ? (
                <div
                  className="mt-0.5 text-[11.5px] leading-snug"
                  style={{ color: "var(--p-muted)" }}
                >
                  {p.detail}
                </div>
              ) : null}
              <div
                className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold"
                style={{ color: "var(--p-ink-2)" }}
              >
                {p.cta ?? "Open in Maps"}
                <span aria-hidden>{I.chevron}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </PatientCard>
  );
}

function PlaceKindBadge({ kind }: { kind: NearbyPlacesProps["places"][number]["kind"] }) {
  const presets: Record<string, { bg: string; fg: string; label: string }> = {
    pt_clinic: { bg: "#2a1f3e", fg: "#c5a8ff", label: "PT" },
    walking_group: { bg: "#1f2e22", fg: "#86efac", label: "Walk" },
    yoga: { bg: "#2e221f", fg: "#fca5a5", label: "Yoga" },
    pool: { bg: "#1c2a37", fg: "#93c5fd", label: "Pool" },
    pharmacy: { bg: "#27201a", fg: "#f5c97a", label: "Rx" },
    store: { bg: "#211e1a", fg: "#e9d094", label: "Shop" },
  };
  const p = presets[kind] ?? presets.store;
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold"
      style={{ background: p.bg, color: p.fg, border: "1px solid var(--p-border)" }}
    >
      {p.label}
    </span>
  );
}

// ----- Recovery shop --------------------------------------------------------
// Products matched to recovery context: ice packs, knee braces, protein
// shakes, fall-risk grab bars, etc. Tappable cards stand in for real
// retailer deeplinks.

export const RecoveryShopProps = z.object({
  title: z.string().describe("Top label, e.g. 'Things to support your recovery'"),
  subtitle: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        why: z.string().describe("One-line reason it matches the patient"),
        price: z
          .string()
          .describe("Pre-formatted, e.g. '$24.99' or 'Covered by insurance'"),
        retailer: z
          .string()
          .describe("Store name, e.g. 'Amazon', 'CVS', 'Walgreens'"),
      }),
    )
    .min(1)
    .max(5),
  tone: toneEnum.optional().default("ochre"),
});
export type RecoveryShopProps = z.infer<typeof RecoveryShopProps>;

export function RecoveryShopCard({
  title,
  subtitle,
  items,
  tone = "ochre",
}: RecoveryShopProps) {
  return (
    <PatientCard className="!p-3.5">
      <div className="flex items-center gap-2">
        <IconBadge tone={coerceBadgeTone(tone)} size={34}>
          {I.sparkle}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div
            className="text-[14.5px] font-semibold leading-tight"
            style={{ color: "var(--p-ink)" }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              className="mt-0.5 text-[12px]"
              style={{ color: "var(--p-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <span className="patient-chip px-2 py-0.5 text-[10.5px]">
          {I.sparkle} Picks
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {items.map((it) => (
          <button
            key={it.name}
            type="button"
            className="flex items-start gap-3 rounded-2xl px-3 py-2.5 text-left"
            style={{
              background: "var(--p-surface-2)",
              border: "1px solid var(--p-border)",
            }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold"
              style={{
                background: "#27201a",
                color: "#f5c97a",
                border: "1px solid var(--p-border)",
              }}
            >
              {retailerInitial(it.retailer)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="truncate text-[13.5px] font-semibold"
                  style={{ color: "var(--p-ink)" }}
                >
                  {it.name}
                </div>
                <div
                  className="shrink-0 text-[11px] font-semibold"
                  style={{ color: "var(--p-green-bright)" }}
                >
                  {it.price}
                </div>
              </div>
              <div
                className="mt-0.5 text-[11.5px] leading-snug"
                style={{ color: "var(--p-muted)" }}
              >
                {it.why}
              </div>
              <div
                className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold"
                style={{ color: "var(--p-ink-2)" }}
              >
                Open in {it.retailer}
                <span aria-hidden>{I.chevron}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </PatientCard>
  );
}

function retailerInitial(retailer: string) {
  const trimmed = retailer.trim();
  return trimmed ? trimmed[0].toUpperCase() : "•";
}

// Map the wider card-level tone enum (which includes "ochre") down to the
// IconBadge tone enum (which does not). "ochre" reads as warm gold so we
// coerce there rather than introducing a new badge color.
function coerceBadgeTone(
  tone: z.infer<typeof toneEnum>,
): "green" | "purple" | "blue" | "red" | "gold" {
  return tone === "ochre" ? "gold" : tone;
}
