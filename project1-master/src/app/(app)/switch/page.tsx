import { ROLE_LABEL, requireUser, type Role } from "@/lib/session";
import { MobileProfile } from "@/components/mobile-profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const role = user.role as Role;
  const label =
    role === "caregiver" || role === "family" || role === "aps"
      ? ROLE_LABEL[role]
      : "Care team";

  return (
    <>
      <MobileProfile
        user={{ name: user.name, role: user.role, email: user.email }}
        roleLabel={label}
      />
      <div className="hidden flex-col gap-5 md:flex md:gap-6">
        <h1 className="text-[34px] font-semibold leading-none tracking-[-0.05em] text-[var(--ink)]">
          Profile
        </h1>
        <p className="text-[var(--muted)]">{user.name} · {label}</p>
        <p className="text-sm text-[var(--muted)]">
          Use the bottom-left identity menu on desktop to switch role or sign out.
        </p>
      </div>
    </>
  );
}
