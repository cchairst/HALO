import { PatientCheckInFlow } from "@/components/patient/check-in-flow";
import { requireUser } from "@/lib/session";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const user = await requireUser();
  const { taskId } = await searchParams;
  return (
    <>
      <PatientCheckInFlow
        user={{ id: user.id, name: user.name }}
        taskId={taskId}
      />
      <div className="hidden md:flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        <p className="max-w-sm text-[13px]">
          Patient check-in is a mobile-first flow. Open this page on a phone.
        </p>
      </div>
    </>
  );
}
