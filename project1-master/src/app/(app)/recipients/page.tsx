import { db } from "@/lib/db";
import { DesktopCareTeams } from "@/components/desktop/care-teams";
import { MobilePatients } from "@/components/mobile-patients";
import { requireUser } from "@/lib/session";

type SP = Promise<{ notice?: string; add?: string }>;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function displayRoom(room: string | null, facility: string | null) {
  return room || facility || "Unassigned";
}

function timeAgo(date: Date) {
  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function severityFromPriority(priority?: string | null): "high" | "med" | "low" | "stable" {
  if (priority === "high" || priority === "med" || priority === "low") return priority;
  return "stable";
}

// Flash messages set by server actions via ?notice=<slug>. Pre-port these
// surfaced after add-patient / add-care-member; the port dropped the banner
// but the actions still redirect with the query param.
function noticeText(notice?: string): string | null {
  if (notice === "patient-added") return "Patient added.";
  if (notice === "member-added") return "Care team updated.";
  if (notice === "no-account") return "No matching profile yet. Send an invite link below.";
  if (notice === "already-linked") return "That person is already on this care team.";
  return null;
}

export default async function RecipientsPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const { add, notice } = await searchParams;
  const isCaregiver = user.role === "caregiver";
  const notice_ = noticeText(notice);

  const memberships = await db.membership.findMany({
    where: {
      userId: user.id,
      ...(user.role === "family"
        ? { recipient: { status: { not: "discharged" } } }
        : {}),
    },
    include: {
      recipient: {
        include: {
          memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
          resources: {
            where: { resolvedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { resources: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const desktopPatients = memberships.map(({ recipient }) => {
    const latest = recipient.resources[0];
    const severity = severityFromPriority(latest?.priority);
    return {
      id: recipient.id,
      initials: initials(recipient.name),
      name: recipient.name,
      age: recipient.age,
      sex: recipient.pronouns ?? "",
      status:
        severity === "stable"
          ? ["Stable"]
          : [severity === "high" ? "High" : severity === "med" ? "Med" : "Low"],
      room: displayRoom(recipient.room, recipient.facility),
      facility: recipient.facility ?? "",
      team: recipient.memberships.slice(0, 3).map((m) => initials(m.user.name)),
      teamExtra: Math.max(0, recipient.memberships.length - 3),
      unreadReports: latest ? 1 : 0,
      updated: latest ? timeAgo(latest.createdAt) : timeAgo(recipient.createdAt),
    };
  });

  const mobilePatients = memberships.map(({ recipient }) => {
    const latest = recipient.resources[0];
    const severity = severityFromPriority(latest?.priority);
    return {
      id: recipient.id,
      initials: initials(recipient.name),
      name: recipient.name,
      age: recipient.age,
      room: displayRoom(recipient.room, recipient.facility),
      mrn: recipient.facility ? recipient.facility : "No facility",
      severity,
      status: latest?.title ?? "Stable",
      time: latest ? timeAgo(latest.createdAt) : timeAgo(recipient.createdAt),
      unread: latest ? 1 : undefined,
    };
  });

  return (
    <>
      <MobilePatients
        patients={mobilePatients}
        isCaregiver={isCaregiver}
        drawerOpen={add === "1"}
      />
      <div className="hidden md:flex flex-1 flex-col">
        {notice_ && (
          <div className="mx-6 mt-4 rounded-lg border border-[rgba(246,189,71,0.32)] bg-[var(--gold-bg)] px-3 py-2 text-[12.5px] font-medium text-[var(--ink-2)]">
            {notice_}
          </div>
        )}
        <DesktopCareTeams patients={desktopPatients} isCaregiver={isCaregiver} />
      </div>
    </>
  );
}
