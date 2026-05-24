"use client";

// Tambo component registry — the list passed to <TamboProvider components={...}>
// that tells the agent which generative-UI primitives it can stream into the
// care plan, and with what props.

import type { TamboComponent } from "@tambo-ai/react";
import {
  ActivityPlanCard,
  ActivityPlanProps,
  CareTeamUpdateCard,
  CareTeamUpdateProps,
  MealPlanCard,
  MealPlanProps,
  MedicationReminderCard,
  MedicationReminderProps,
  MilestoneCard,
  MilestoneProps,
  NearbyPlacesCard,
  NearbyPlacesProps,
  RecoveryShopCard,
  RecoveryShopProps,
} from "@/components/patient/care-plan/cards";

export const PLAN_COMPONENTS: TamboComponent[] = [
  {
    name: "CareTeamUpdate",
    description:
      "A short note pinned by a member of the care team — e.g. a doctor commenting on the patient’s latest check-in. Use for human-authored or human-attributed updates, not for AI-generated plans.",
    component: CareTeamUpdateCard,
    propsSchema: CareTeamUpdateProps,
  },
  {
    name: "ActivityPlan",
    description:
      "An updated activity plan for the day or the week. 1–6 concrete bullets the patient should follow (e.g. walk duration, exercises to avoid, what to do tonight).",
    component: ActivityPlanCard,
    propsSchema: ActivityPlanProps,
  },
  {
    name: "MedicationReminder",
    description:
      "A reminder for a specific medication with dose, schedule, and next-dose time. Lets the patient log that they’ve taken the dose.",
    component: MedicationReminderCard,
    propsSchema: MedicationReminderProps,
  },
  {
    name: "MealPlan",
    description:
      "A recovery-focused meal plan card with 1–6 meals appropriate to the patient’s diagnosis (e.g. high-protein for post-op, heart-smart for cardiac rehab).",
    component: MealPlanCard,
    propsSchema: MealPlanProps,
  },
  {
    name: "Milestone",
    description:
      "A milestone or achievement in the patient’s recovery — e.g. first full week on plan, stairs without aid.",
    component: MilestoneCard,
    propsSchema: MilestoneProps,
  },
  {
    name: "NearbyPlaces",
    description:
      "Local places recommended for the patient's recovery — PT clinics, walking groups, recovery-friendly yoga studios, pools, pharmacies. Each item is tappable and would deeplink into Maps. Use when the patient asks for in-person support nearby, or when their plan calls for it (e.g. starting outpatient PT).",
    component: NearbyPlacesCard,
    propsSchema: NearbyPlacesProps,
  },
  {
    name: "RecoveryShop",
    description:
      "Products matched to the patient's recovery — ice packs, knee braces, mobility aids, protein supplements, etc. Each item shows price and retailer; tap would deeplink to the store. Use when the patient could benefit from a physical item, not when they need a service or appointment.",
    component: RecoveryShopCard,
    propsSchema: RecoveryShopProps,
  },
];

// Local renderer used when there's no Tambo API key — maps a seed message's
// {component, props} into the matching React element so the demo renders
// without a live agent.
export function renderPlanComponent(
  name: string,
  props: Record<string, unknown>,
): React.ReactNode {
  switch (name) {
    case "CareTeamUpdate":
      return <CareTeamUpdateCard {...(props as CareTeamUpdateProps)} />;
    case "ActivityPlan":
      return <ActivityPlanCard {...(props as ActivityPlanProps)} />;
    case "MedicationReminder":
      return (
        <MedicationReminderCard {...(props as MedicationReminderProps)} />
      );
    case "MealPlan":
      return <MealPlanCard {...(props as MealPlanProps)} />;
    case "Milestone":
      return <MilestoneCard {...(props as MilestoneProps)} />;
    case "NearbyPlaces":
      return <NearbyPlacesCard {...(props as NearbyPlacesProps)} />;
    case "RecoveryShop":
      return <RecoveryShopCard {...(props as RecoveryShopProps)} />;
    default:
      return null;
  }
}
