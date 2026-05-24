import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  ClipboardList,
  FileText,
  HandHeart,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { GlassCard, Pill } from "@/components/glass";
import { requireUser } from "@/lib/session";
import { AccessError, assertCanReadRecipient, logAudit } from "@/lib/access";
import { getRecipientTimeline, type TimelineEntry } from "@/lib/timeline";

export const dynamic = "force-dynamic";

function formatStamp(d: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function entryIcon(kind: TimelineEntry["kind"]) {
  switch (kind) {
    case "report":
      return <FileText className="size-4" />;
    case "ai_plan":
      return <Bot className="size-4" />;
    case "service_proposed":
      return <HandHeart className="size-4" />;
    case "service_decided":
      return <CheckCheck className="size-4" />;
    case "chart_suggestion_accepted":
      return <Sparkles className="size-4" />;
  }
}

function entryTone(kind: TimelineEntry["kind"]): "live" | "open" | "neutral" | "aps" {
  switch (kind) {
    case "report":
      return "neutral";
    case "ai_plan":
      return "open";
    case "service_proposed":
      return "aps";
    case "service_decided":
      return "live";
    case "chart_suggestion_accepted":
      return "open";
  }
}

export default async function RecipientTimeline({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  try {
    await assertCanReadRecipient(user, id);
  } catch (err) {
    if (err instanceof AccessError) notFound();
    throw err;
  }

  const recipient = await db.careRecipient.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
  if (!recipient) notFound();

  void logAudit({
    actorId: user.id,
    recipientId: id,
    action: "phi.read.timeline",
    target: `CareRecipient:${id}`,
  });

  const entries = await getRecipientTimeline(id);

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center gap-2">
        <Link
          href={`/recipients/${id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink-2)]"
        >
          <ArrowLeft className="size-4" />
          Back to chart
        </Link>
      </div>

      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--gold-soft)]">
          <ClipboardList className="size-4" />
          CARE TIMELINE
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {recipient.name}
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          A single thread of what&apos;s happened on{" "}
          {recipient.name.split(" ")[0]}&apos;s care, why it happened, and who
          was involved. New events appear here as the care team works.
        </p>
      </header>

      <GlassCard strong className="p-4 sm:p-5">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-8 text-center text-sm text-[var(--muted)]">
            No timeline events yet. Reports, services, and chart updates will
            show up here as they happen.
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--gold-soft)]">
                    {entryIcon(e.kind)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-[var(--ink)]">
                        {e.title}
                      </h2>
                      <Pill tone={entryTone(e.kind)} className="!text-[10px]">
                        {kindLabel(e.kind)}
                      </Pill>
                      <span className="text-[11px] text-[var(--muted)]">
                        {formatStamp(e.at)}
                      </span>
                    </div>
                    {e.actorName && (
                      <div className="mt-0.5 text-[12px] text-[var(--muted)]">
                        by{" "}
                        <span className="font-semibold text-[var(--ink-2)]">
                          {e.actorName}
                        </span>
                        {e.actorRole && (
                          <span className="ml-1 text-[var(--muted-2)]">
                            ({roleLabelShort(e.actorRole)})
                          </span>
                        )}
                      </div>
                    )}
                    {e.body && (
                      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                        {e.body}
                      </p>
                    )}
                    {e.why && (
                      <div className="mt-2 rounded-lg border border-[rgba(246,189,71,0.25)] bg-[var(--gold-bg)] px-3 py-1.5 text-[12px] leading-relaxed text-[var(--ink-2)]">
                        <span className="mr-1 font-semibold text-[var(--gold-soft)]">
                          Why:
                        </span>
                        {e.why}
                      </div>
                    )}
                    {e.href && (
                      <Link
                        href={e.href}
                        className="mt-2 inline-flex text-[12px] font-medium text-[var(--gold-soft)] underline-offset-2 hover:underline"
                      >
                        Open source →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </GlassCard>
    </main>
  );
}

function kindLabel(kind: TimelineEntry["kind"]) {
  switch (kind) {
    case "report":
      return "Report";
    case "ai_plan":
      return "AI plan";
    case "service_proposed":
      return "Service proposed";
    case "service_decided":
      return "Service decision";
    case "chart_suggestion_accepted":
      return "Chart update";
  }
}

function roleLabelShort(role: string) {
  if (role === "caregiver") return "Nurse";
  if (role === "family") return "Family";
  if (role === "aps") return "Service";
  return "Care team";
}
