// Service offerings a Social & Protective Services agent can propose for a
// patient. Stored as strings on ServiceOffering.serviceType so adding a new
// type doesn't require a schema migration.

export const SERVICE_TYPES = [
  "physical_therapy",
  "occupational_therapy",
  "speech_therapy",
  "social_work",
  "home_health_aide",
  "mental_health",
  "welfare_check",
  "transportation",
  "other",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export function isServiceType(s: string): s is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(s);
}

export const SERVICE_LABEL: Record<ServiceType, string> = {
  physical_therapy: "Physical therapy",
  occupational_therapy: "Occupational therapy",
  speech_therapy: "Speech therapy",
  social_work: "Social work",
  home_health_aide: "Home health aide",
  mental_health: "Mental health counseling",
  welfare_check: "Welfare check",
  transportation: "Transportation",
  other: "Other service",
};

export const OFFERING_STATUSES = [
  "proposed",
  "accepted",
  "declined",
  "completed",
  "withdrawn",
] as const;

export type OfferingStatus = (typeof OFFERING_STATUSES)[number];

export function isOfferingStatus(s: string): s is OfferingStatus {
  return (OFFERING_STATUSES as readonly string[]).includes(s);
}

export const OFFERING_STATUS_LABEL: Record<OfferingStatus, string> = {
  proposed: "Proposed",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
  withdrawn: "Withdrawn",
};
