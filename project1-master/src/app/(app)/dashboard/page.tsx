import { DesktopShiftHub } from "@/components/desktop/shift-hub";
import { PatientTodayScreen } from "@/components/patient/today-screen";
import { db } from "@/lib/db";
import { getCatchUpForUser } from "@/lib/catch-up";
import { requireUser } from "@/lib/session";

export default async function Dashboard() {
  const user = await requireUser();
  const catchUp = await getCatchUpForUser(user.id);

  // Patient-side Today list: pull tasks for whichever CareRecipient the
  // patient is a member of. For multi-team patients we just merge all rows
  // sorted by completedAt asc + createdAt desc so pending work surfaces first.
  const patientTasks = await db.patientTask.findMany({
    where: {
      recipient: { memberships: { some: { userId: user.id } } },
    },
    orderBy: [{ completedAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      subtitle: true,
      kind: true,
      completedAt: true,
    },
  });

  return (
    <>
      {/* Mobile — patient-side recovery companion */}
      <PatientTodayScreen
        user={{ id: user.id, name: user.name }}
        tasks={patientTasks}
      />

      {/* Desktop — Shift Hub stays for the (future) clinical side */}
      <div className="hidden md:flex flex-1 flex-col">
        <DesktopShiftHub stats={catchUp.stats} />
      </div>
    </>
  );
}
