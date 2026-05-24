import { redirect } from "next/navigation";
import { MobileBottomNav } from "@/components/nav";
import { PlusDrawerHost } from "@/components/plus-drawer-host";
import { DesktopAppShell } from "@/components/desktop/app-shell";
import { IdleLock } from "@/components/idle-lock";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { getSession, isDemoMode, type Role } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session.kind === "anon") redirect("/");
  if (session.kind === "privy" && !session.user) redirect("/onboarding");

  const user = session.user!;
  const role = user.role as Role;
  if (role !== "caregiver" && role !== "family" && role !== "aps") redirect("/");

  const demoMode = isDemoMode();

  const [plusPeople, plusPatients] = await Promise.all([
    db.user.findMany({
      where: { id: { not: user.id } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, role: true },
    }),
    db.membership
      .findMany({
        where: { userId: user.id },
        include: { recipient: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      })
      .then((rows) =>
        rows.map((m) => ({ id: m.recipient.id, name: m.recipient.name })),
      ),
  ]);

  const dict = await getDictionary();

  return (
    <DesktopAppShell userName={user.name}>
      <main className="flex flex-1 flex-col min-w-0 px-0 pb-28 pt-0 md:px-0 md:pt-0 md:pb-0">
        {children}
      </main>
      <MobileBottomNav
        labels={{
          chats: dict.nav.chats,
          patients: dict.nav.patients,
          catchUp: dict.nav.catchUp,
          profile: dict.nav.profile,
        }}
      />
      <PlusDrawerHost
        role={role}
        people={plusPeople}
        patients={plusPatients}
      />
      <IdleLock />
      {demoMode ? null : null}
    </DesktopAppShell>
  );
}
