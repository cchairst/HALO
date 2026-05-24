import "server-only";

import { db } from "@/lib/db";

type ReportSeverity = "high" | "med" | "low";
type ActivityIcon = "alert" | "chat" | "clipboard" | "check" | "flask";
type ActivityTag = "Lab" | "Chat" | "Care Plan" | "MAR";

export type CatchUpData = {
  stats: {
    openThreads: number;
    urgentUpdates: number;
    unresolvedItems: number;
    patientsNeedingAttention: number;
  };
  needingAttention: Array<{
    recipientId: string;
    room: string | null;
    name: string;
    age: number;
    severity: ReportSeverity;
    statusLine: string;
    timeAgo: string;
  }>;
  recentActivity: Array<{
    id: string;
    time: string;
    icon: ActivityIcon;
    title: string;
    by: string;
    tag: ActivityTag;
  }>;
  unresolved: Array<{
    id: string;
    severity: ReportSeverity | "stable";
    title: string;
    who: string;
    due: string;
  }>;
};

const REPORT_TYPES = {
  lab: { icon: "flask", tag: "Lab" },
  medication: { icon: "check", tag: "MAR" },
  handoff: { icon: "clipboard", tag: "Care Plan" },
  pain: { icon: "alert", tag: "Chat" },
  note: { icon: "chat", tag: "Chat" },
} satisfies Record<string, { icon: ActivityIcon; tag: ActivityTag }>;

function normalizePriority(priority: string): ReportSeverity {
  if (priority === "high" || priority === "med" || priority === "low") return priority;
  return "low";
}

function activityForType(type: string) {
  return REPORT_TYPES[type as keyof typeof REPORT_TYPES] ?? REPORT_TYPES.note;
}

function displayRoom(room: string | null | undefined, facility: string | null | undefined) {
  return room || facility || null;
}

function patientLabel(name: string, room: string | null) {
  return room ? `${name} (${room})` : name;
}

function timeString(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timeAgo(date: Date) {
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function dueFor(createdAt: Date, priority: ReportSeverity | "stable") {
  const minutes = priority === "high" ? 30 : priority === "med" ? 120 : 360;
  const due = new Date(createdAt.getTime() + minutes * 60000);
  // Temporary demo heuristic until care reports get a real due-date field.
  return `Due ${timeString(due)}`;
}

export async function getCatchUpForUser(userId: string): Promise<CatchUpData> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [resources, openThreads] = await Promise.all([
    db.resource.findMany({
      where: {
        recipient: {
          memberships: {
            some: { userId },
          },
        },
      },
      include: {
        recipient: true,
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.thread.count({
      where: {
        members: { some: { userId } },
        messages: { some: { createdAt: { gte: since } } },
      },
    }),
  ]);

  const unresolved = resources.filter((resource) => !resource.resolvedAt);
  const urgentUpdates = unresolved.filter((resource) => resource.priority === "high").length;

  const attentionByPatient = new Map<string, (typeof resources)[number]>();
  for (const resource of unresolved) {
    const priority = normalizePriority(resource.priority);
    if (priority !== "high" && priority !== "med") continue;
    if (!attentionByPatient.has(resource.recipientId)) {
      attentionByPatient.set(resource.recipientId, resource);
    }
  }

  return {
    stats: {
      openThreads,
      urgentUpdates,
      unresolvedItems: unresolved.length,
      patientsNeedingAttention: attentionByPatient.size,
    },
    needingAttention: Array.from(attentionByPatient.values()).map((resource) => {
      const room = displayRoom(resource.recipient.room, resource.recipient.facility);
      return {
        recipientId: resource.recipientId,
        room,
        name: resource.recipient.name,
        age: resource.recipient.age,
        severity: normalizePriority(resource.priority),
        statusLine: resource.title,
        timeAgo: timeAgo(resource.createdAt),
      };
    }),
    recentActivity: resources.slice(0, 8).map((resource) => {
      const room = displayRoom(resource.recipient.room, resource.recipient.facility);
      const activity = activityForType(resource.type);
      return {
        id: resource.id,
        time: timeString(resource.createdAt),
        icon: activity.icon,
        title: resource.title,
        by: `${resource.author.name} - ${patientLabel(resource.recipient.name, room)}`,
        tag: activity.tag,
      };
    }),
    unresolved: unresolved.slice(0, 8).map((resource) => {
      const severity = normalizePriority(resource.priority);
      const room = displayRoom(resource.recipient.room, resource.recipient.facility);
      return {
        id: resource.id,
        severity,
        title: resource.title,
        who: patientLabel(resource.recipient.name, room),
        due: dueFor(resource.createdAt, severity),
      };
    }),
  };
}
