// Status definitions for CareRecipient.status.
// One source of truth for labels, tones, and side-effect rules.

export const STATUSES = [
  "stable",
  "monitoring",
  "critical",
  "ready_for_discharge",
  "discharged",
  "deceased",
] as const;

export type RecipientStatus = (typeof STATUSES)[number];

export function isRecipientStatus(s: string): s is RecipientStatus {
  return (STATUSES as readonly string[]).includes(s);
}

export const STATUS_META: Record<
  RecipientStatus,
  {
    label: string;
    /** Optional shorter label for the pill. Falls back to `label`. */
    pillLabel?: string;
    description: string;
    pillBg: string;
    pillText: string;
    pillRing: string;
  }
> = {
  stable: {
    label: "Stable",
    description: "Routine care. No active concerns.",
    pillBg: "bg-[rgba(34,197,94,0.12)]",
    pillText: "text-[#4ade80]",
    pillRing: "ring-[rgba(34,197,94,0.4)]",
  },
  monitoring: {
    label: "Monitoring",
    description: "Watch closely. Daily check-ins enabled.",
    pillBg: "bg-[rgba(246,189,71,0.18)]",
    pillText: "text-[var(--gold-soft)]",
    pillRing: "ring-[rgba(246,189,71,0.55)]",
  },
  critical: {
    label: "Critical",
    description:
      "Acute concern. Social & protective service team notified, family alerted.",
    pillBg: "bg-[rgba(239,68,68,0.15)]",
    pillText: "text-[#fca5a5]",
    pillRing: "ring-[rgba(239,68,68,0.5)]",
  },
  ready_for_discharge: {
    label: "Ready for discharge",
    // Pill stays compact so it doesn't blow out the picker dropdown row.
    pillLabel: "Ready",
    description:
      "Cleared for discharge. Service agents — propose follow-up services (PT, social work, etc.) before sign-off.",
    pillBg: "bg-[rgba(20,184,166,0.16)]",
    pillText: "text-[#5eead4]",
    pillRing: "ring-[rgba(20,184,166,0.5)]",
  },
  discharged: {
    label: "Discharged",
    description: "No longer in active care. Hidden from family list.",
    pillBg: "bg-[rgba(96,165,250,0.16)]",
    pillText: "text-[#93c5fd]",
    pillRing: "ring-[rgba(96,165,250,0.5)]",
  },
  deceased: {
    label: "Deceased",
    description: "Chart locked. Bereavement resource available.",
    pillBg: "bg-[rgba(148,163,184,0.16)]",
    pillText: "text-[#cbd5e1]",
    pillRing: "ring-[rgba(148,163,184,0.5)]",
  },
};

// Declarative description of what each status does on transition.
export const STATUS_EFFECTS: Record<
  RecipientStatus,
  {
    notifyChat: boolean;
    notifyAps: boolean;
    hideFromFamily: boolean;
    lockChart: boolean;
    aiCarePlan: boolean;
    aiBereavement: boolean;
    aiCheckInSchedule: boolean;
  }
> = {
  stable: {
    notifyChat: true,
    notifyAps: false,
    hideFromFamily: false,
    lockChart: false,
    aiCarePlan: false,
    aiBereavement: false,
    aiCheckInSchedule: false,
  },
  monitoring: {
    notifyChat: true,
    notifyAps: false,
    hideFromFamily: false,
    lockChart: false,
    aiCarePlan: false,
    aiBereavement: false,
    aiCheckInSchedule: true,
  },
  critical: {
    notifyChat: true,
    notifyAps: true,
    hideFromFamily: false,
    lockChart: false,
    aiCarePlan: false,
    aiBereavement: false,
    aiCheckInSchedule: false,
  },
  ready_for_discharge: {
    // Trigger for service agents to step in. Notify the chat so everyone
    // sees it, plus a direct ping to any service agents on the team so
    // they can offer follow-up services before discharge.
    notifyChat: true,
    notifyAps: true,
    hideFromFamily: false,
    lockChart: false,
    aiCarePlan: false,
    aiBereavement: false,
    aiCheckInSchedule: false,
  },
  discharged: {
    notifyChat: true,
    notifyAps: false,
    hideFromFamily: true,
    lockChart: false,
    aiCarePlan: true,
    aiBereavement: false,
    aiCheckInSchedule: false,
  },
  deceased: {
    notifyChat: true,
    notifyAps: false,
    hideFromFamily: false,
    lockChart: true,
    aiCarePlan: false,
    aiBereavement: true,
    aiCheckInSchedule: false,
  },
};

export function statusChangeMessage(args: {
  nurseName: string;
  patientName: string;
  next: RecipientStatus;
}): string {
  const meta = STATUS_META[args.next];
  return `[Status update] ${args.nurseName} marked ${args.patientName} as ${meta.label}. ${meta.description}`;
}
