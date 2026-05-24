import { PatientProfileScreen } from "@/components/patient/profile-screen";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PatientProfileScreen
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <div className="hidden md:flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        <p className="max-w-sm text-[13px]">
          Use the bottom-left identity menu on desktop to switch role or sign
          out.
        </p>
      </div>
    </>
  );
}
