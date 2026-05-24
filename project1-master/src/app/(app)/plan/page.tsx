import { requireUser } from "@/lib/session";
import { PatientCarePlanScreen } from "@/components/patient/care-plan/screen";

export default async function PlanPage() {
  const user = await requireUser();
  return (
    <>
      {/* Mobile: the patient's Care Plan — Tambo cards per care team. */}
      <PatientCarePlanScreen user={{ id: user.id, name: user.name }} />

      {/* Desktop: not used for the patient demo. The clinical side stays on
          /messages + /dashboard. */}
      <div className="hidden md:flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        <p className="max-w-sm text-[13px]">
          The Care Plan view is patient-facing. Open this page on a phone.
        </p>
      </div>
    </>
  );
}
