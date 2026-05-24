import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DesktopPatientChart } from "@/components/desktop/patient-chart";
import { MobilePatientDetail } from "@/components/mobile-patient-detail";
import { PatientInviteBanner } from "@/components/patient-invite-banner";
import { requireUser } from "@/lib/session";
import { AccessError, assertCanReadRecipient, logAudit } from "@/lib/access";

export default async function RecipientDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ inviteCreated?: string }>;
}) {
  const { id } = await params;
  const { inviteCreated } = await searchParams;
  const user = await requireUser();

  try {
    await assertCanReadRecipient(user, id);
  } catch (err) {
    if (err instanceof AccessError) notFound();
    throw err;
  }

  // Fire-and-forget audit row: every chart view is logged. We don't await
  // long enough to slow the page — logAudit handles its own errors.
  void logAudit({
    actorId: user.id,
    recipientId: id,
    action: "phi.read.chart",
    target: `CareRecipient:${id}`,
  });

  const recipient = await db.careRecipient.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
      familyContacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      serviceOfferings: {
        orderBy: { createdAt: "desc" },
        include: { proposedBy: true, decidedBy: true },
      },
      resources: {
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
          accessRequests: {
            include: { requestedBy: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      patientTasks: {
        // Pending first (completedAt null sorts before timestamps when we
        // order by completedAt asc + createdAt desc), so the doctor sees
        // outstanding work at the top of the Homework panel.
        orderBy: [{ completedAt: "asc" }, { createdAt: "desc" }],
        include: { assignedBy: { select: { name: true } } },
      },
    },
  });
  if (!recipient) notFound();

  // Surface the freshly-minted patient invite link if the nurse just landed
  // here from "Add Patient" (?inviteCreated=<token>). Validate the token
  // before showing — wrong recipient, expired, or consumed → silently skip.
  let inviteBanner: { url: string; email: string } | null = null;
  if (inviteCreated && user.role === "caregiver") {
    const inv = await db.serviceInvite.findUnique({ where: { token: inviteCreated } });
    if (
      inv &&
      inv.recipientId === recipient.id &&
      !inv.consumedAt &&
      inv.expiresAt > new Date()
    ) {
      const h = await headers();
      const host = h.get("host") ?? "";
      const proto =
        h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      const origin = host ? `${proto}://${host}` : "";
      inviteBanner = {
        url: `${origin}/onboarding?invite=${encodeURIComponent(inv.token)}`,
        email: inv.email,
      };
    }
  }

  const reports = recipient.resources.filter((report) =>
    user.role === "family" ? !report.confidential : true,
  );
  const isCaregiver = user.role === "caregiver";
  const isLocked = recipient.status === "deceased";
  const canPost = user.role === "caregiver" && !isLocked;

  const offeringRows = recipient.serviceOfferings.map((o) => ({
    id: o.id,
    serviceType: o.serviceType,
    frequency: o.frequency,
    startDate: o.startDate,
    durationWeeks: o.durationWeeks,
    notes: o.notes,
    status: o.status,
    proposedByName: o.proposedBy.name,
    proposedByIsCurrentUser: o.proposedBy.id === user.id,
    decidedByName: o.decidedBy?.name ?? null,
    decisionNote: o.decisionNote,
    createdAt: o.createdAt,
  }));

  const patientView = {
    id: recipient.id,
    name: recipient.name,
    age: recipient.age,
    pronouns: recipient.pronouns,
    room: recipient.room,
    facility: recipient.facility,
    allergies: recipient.allergies,
    notes: recipient.notes,
    status: recipient.status,
    members: recipient.memberships.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      role: m.user.role,
      familyKind: m.user.familyKind,
    })),
    reports: reports.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      confidential: r.confidential,
      type: r.type,
      priority: r.priority,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      authorName: r.author.name,
      authorRole: r.author.role,
      accessRequests: r.accessRequests.map((req) => ({
        id: req.id,
        status: req.status,
        reason: req.reason,
        requestedById: req.requestedBy.id,
        requestedByName: req.requestedBy.name,
        createdAt: req.createdAt,
      })),
    })),
    familyContacts: recipient.familyContacts.map((c) => ({
      id: c.id,
      name: c.name,
      relation: c.relation,
      email: c.email,
      phone: c.phone,
      isPrimary: c.isPrimary,
      notes: c.notes,
    })),
    tasks: recipient.patientTasks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      kind: t.kind,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      painScore: t.painScore,
      note: t.note,
      photoUrl: t.photoUrl,
      assignedByName: t.assignedBy.name,
    })),
    canPost,
    canMarkInternal: isCaregiver,
    canEditFamily: isCaregiver && !isLocked,
    isLocked,
  };

  return (
    <>
      {inviteBanner && (
        <div className="md:hidden -mx-4 mb-4 px-4">
          <PatientInviteBanner
            url={inviteBanner.url}
            email={inviteBanner.email}
            patientName={recipient.name}
          />
        </div>
      )}
      <MobilePatientDetail
        currentUserId={user.id}
        currentRole={user.role}
        patient={patientView}
        recipient={patientView}
        members={recipient.memberships.map((m) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          role: m.user.role,
          familyKind: m.user.familyKind,
        }))}
        familyContacts={recipient.familyContacts.map((c) => ({
          id: c.id,
          name: c.name,
          relation: c.relation,
          email: c.email,
          phone: c.phone,
          isPrimary: c.isPrimary,
          notes: c.notes,
        }))}
        offerings={offeringRows}
        reports={reports.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          confidential: r.confidential,
          createdAt: r.createdAt,
          authorName: r.author.name,
          authorRole: r.author.role,
          accessRequests: r.accessRequests.map((req) => ({
            id: req.id,
            status: req.status,
            reason: req.reason,
            requestedById: req.requestedBy.id,
            requestedByName: req.requestedBy.name,
            createdAt: req.createdAt,
          })),
        }))}
        canPost={canPost}
        canMarkInternal={isCaregiver}
        isLocked={isLocked}
      />

      <div className="hidden md:flex flex-1 flex-col">
        {inviteBanner && (
          <div className="px-6 pt-4">
            <PatientInviteBanner
              url={inviteBanner.url}
              email={inviteBanner.email}
              patientName={recipient.name}
            />
          </div>
        )}
        <DesktopPatientChart patient={patientView} />
      </div>
    </>
  );
}
