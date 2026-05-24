import "server-only";

import { db } from "@/lib/db";
import { SERVICE_LABEL, isServiceType } from "@/lib/service-types";

export type TimelineEntry = {
  id: string;
  // Event kind drives how the row is rendered (icon, color, link target).
  kind:
    | "report"
    | "ai_plan"
    | "service_proposed"
    | "service_decided"
    | "chart_suggestion_accepted";
  at: Date;
  // Short headline shown bold.
  title: string;
  // Optional one-paragraph body. Kept short — anything longer should link to
  // its source.
  body?: string;
  // Who caused this event (for "why" / provenance).
  actorName?: string;
  actorRole?: string;
  // Plain-language explanation of *why* this entry exists. The user
  // explicitly called this out: "Hospitals show families paperwork; this
  // shows them the story."
  why?: string;
  // Where to drill in for the full source (if applicable).
  href?: string;
};

// Build the per-recipient timeline by merging the discrete event tables we
// already write to: Resources (nurse reports, AI plans, bereavement notes),
// ServiceOfferings (proposed + decided are two separate events), and
// accepted ChatChartSuggestions (the bridge from this PR's #4 to #5).
//
// Status-change history is intentionally NOT included here — we don't store
// that history yet. When a StatusEvent table lands this is the merge point.
export async function getRecipientTimeline(
  recipientId: string,
): Promise<TimelineEntry[]> {
  const [resources, offerings, suggestions] = await Promise.all([
    db.resource.findMany({
      where: { recipientId },
      include: { author: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.serviceOffering.findMany({
      where: { recipientId },
      include: {
        proposedBy: { select: { name: true, role: true } },
        decidedBy: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.chatChartSuggestion.findMany({
      where: { recipientId, status: "accepted" },
      include: {
        decidedBy: { select: { name: true, role: true } },
        message: { select: { body: true, authorId: true } },
      },
      orderBy: { decidedAt: "desc" },
    }),
  ]);

  const entries: TimelineEntry[] = [];

  for (const r of resources) {
    const isAi = r.title.toLowerCase().includes("(ai draft)");
    entries.push({
      id: `r-${r.id}`,
      kind: isAi ? "ai_plan" : "report",
      at: r.createdAt,
      title: r.title,
      body: r.body.length > 220 ? `${r.body.slice(0, 220)}...` : r.body,
      actorName: r.author.name,
      actorRole: r.author.role,
      why: isAi
        ? "Auto-drafted from chart notes and recent reports — your nurse reviews before sharing."
        : `Posted by ${r.author.name} so the next shift sees what changed.`,
      href: `/resources?patient=${recipientId}`,
    });
  }

  for (const o of offerings) {
    const label = isServiceType(o.serviceType) ? SERVICE_LABEL[o.serviceType] : o.serviceType;
    // (1) the proposal itself.
    entries.push({
      id: `op-${o.id}`,
      kind: "service_proposed",
      at: o.createdAt,
      title: `${label} proposed`,
      body: [
        o.frequency ? `Frequency: ${o.frequency}` : null,
        o.notes ? `Notes: ${o.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n") || undefined,
      actorName: o.proposedBy.name,
      actorRole: o.proposedBy.role,
      why: `${o.proposedBy.name} (Service) suggested this follow-up so the patient has support after discharge.`,
    });
    // (2) the decision, if any. We render this as a separate timeline event
    // so the family sees both halves of the conversation.
    if (o.decidedAt && o.status !== "proposed") {
      entries.push({
        id: `od-${o.id}`,
        kind: "service_decided",
        at: o.decidedAt,
        title: `${label} ${o.status}`,
        body: o.decisionNote ?? undefined,
        actorName: o.decidedBy?.name,
        actorRole: o.decidedBy?.role,
        why:
          o.status === "accepted"
            ? "Accepted — this service is confirmed for the patient."
            : o.status === "declined"
              ? "Declined — this service won't be part of the plan."
              : o.status === "withdrawn"
                ? "Withdrawn by the proposing agent."
                : o.status === "completed"
                  ? "Marked completed."
                  : undefined,
      });
    }
  }

  for (const s of suggestions) {
    if (!s.decidedAt) continue;
    entries.push({
      id: `cs-${s.id}`,
      kind: "chart_suggestion_accepted",
      at: s.decidedAt,
      title: `Chart updated — ${s.field}`,
      body: `"${s.value}"`,
      actorName: s.decidedBy?.name,
      actorRole: s.decidedBy?.role,
      why:
        "Picked up from a chat message and added to the chart so the next shift has it.",
    });
  }

  // Newest first. Stable on tie-breaks via id.
  entries.sort((a, b) => {
    const diff = +b.at - +a.at;
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });

  return entries;
}
