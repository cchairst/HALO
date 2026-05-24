// Mock care teams + seed plan messages. A patient can be a member of more
// than one care team; the Care Plan screen lets them switch between teams.
// Once Tambo is wired with a real API key, these seeds are replaced by live
// messages streamed from the agent.

export type PlanCardName =
  | "CareTeamUpdate"
  | "ActivityPlan"
  | "MedicationReminder"
  | "MealPlan"
  | "Milestone"
  | "NearbyPlaces"
  | "RecoveryShop";

// One pinned message in a care team plan. Mirrors how Tambo would emit a
// rendered component: a component name + a props payload that matches that
// component's Zod schema.
export type PlanMessage = {
  id: string;
  time: string;
  sender: "ai" | "care_team";
  senderName: string;
  component: PlanCardName;
  // Props are intentionally loose here — runtime validation lives in each
  // card's Zod schema.
  props: Record<string, unknown>;
  reactions?: { thumbs?: number };
};

export type CareTeam = {
  id: string;
  shortLabel: string;
  longLabel: string;
  tagline: string;
  lead: {
    name: string;
    role: string;
    tint: "ochre" | "green" | "purple";
  };
  daysSince: number;
  totalDays: number;
  messages: PlanMessage[];
};

export const CARE_TEAMS: CareTeam[] = [
  {
    id: "ortho",
    shortLabel: "Orthopedic",
    longLabel: "Orthopedic recovery",
    tagline: "Right knee arthroscopy — Day 4",
    lead: { name: "Dr. Aisha Lee", role: "Orthopedic surgeon", tint: "ochre" },
    daysSince: 4,
    totalDays: 42,
    messages: [
      {
        id: "ortho-1",
        time: "8:30 AM",
        sender: "care_team",
        senderName: "Dr. Lee",
        component: "CareTeamUpdate",
        props: {
          doctorName: "Dr. Lee",
          headline: "Dr. Lee reviewed your check-in.",
          body: "We adjusted today’s plan for a lighter activity day.",
          tone: "ochre",
        },
        reactions: { thumbs: 2 },
      },
      {
        id: "ortho-2",
        time: "8:31 AM",
        sender: "ai",
        senderName: "Halo AI",
        component: "ActivityPlan",
        props: {
          title: "Lighter activity day",
          subtitle: "Your updated activity plan",
          bullets: [
            "Avoid stairs and heavy lifting",
            "Short, easy walks indoors or outside",
            "Check in again tonight",
          ],
          cta: "View full plan",
          tone: "green",
        },
      },
      {
        id: "ortho-3",
        time: "8:31 AM",
        sender: "ai",
        senderName: "Halo AI",
        component: "MedicationReminder",
        props: {
          name: "Acetaminophen 500 mg",
          dosage: "Take 1 tablet",
          schedule: "Every 6 hours",
          nextDoseAt: "2:30 PM",
          tone: "purple",
        },
      },
    ],
  },
  {
    id: "cardiac",
    shortLabel: "Cardiac",
    longLabel: "Cardiac rehab",
    tagline: "Stent placement — Day 12",
    lead: { name: "Dr. Marcus Chen", role: "Cardiologist", tint: "green" },
    daysSince: 12,
    totalDays: 84,
    messages: [
      {
        id: "card-1",
        time: "7:45 AM",
        sender: "care_team",
        senderName: "Dr. Chen",
        component: "CareTeamUpdate",
        props: {
          doctorName: "Dr. Chen",
          headline: "Pulse trends are steady this week.",
          body: "Keeping medications the same. Adding a short cardio block tomorrow.",
          tone: "green",
        },
        reactions: { thumbs: 4 },
      },
      {
        id: "card-2",
        time: "7:46 AM",
        sender: "ai",
        senderName: "Halo AI",
        component: "ActivityPlan",
        props: {
          title: "Light cardio block",
          subtitle: "Tomorrow’s activity plan",
          bullets: [
            "10-minute warm-up walk at conversation pace",
            "15 minutes recumbent bike, RPE 4–5",
            "5-minute cool-down + stretch",
          ],
          cta: "Open today’s plan",
          tone: "green",
        },
      },
      {
        id: "card-3",
        time: "7:46 AM",
        sender: "ai",
        senderName: "Halo AI",
        component: "MedicationReminder",
        props: {
          name: "Atorvastatin 20 mg",
          dosage: "Take 1 tablet",
          schedule: "Once daily, evening",
          nextDoseAt: "9:00 PM",
          tone: "purple",
        },
      },
    ],
  },
];

export function getCareTeam(id: string): CareTeam {
  return CARE_TEAMS.find((t) => t.id === id) ?? CARE_TEAMS[0];
}
