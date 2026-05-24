import { PatientProgressScreen } from "@/components/patient/progress-screen";
import { requireUser } from "@/lib/session";

export default async function ProgressPage() {
  const user = await requireUser();
  return (
    <>
      <PatientProgressScreen user={{ id: user.id, name: user.name }} />
      <div className="hidden md:flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        <p className="max-w-sm text-[13px]">
          Progress is a mobile-first view for the patient. Open this page on a
          phone.
        </p>
      </div>
    </>
  );
}
