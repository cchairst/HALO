import { DesktopCatchUp } from "@/components/desktop/catch-up";
import { getCatchUpForUser } from "@/lib/catch-up";
import { requireUser } from "@/lib/session";
import { MobileCatchUp } from "@/components/mobile-catch-up";

export default async function CatchUpPage() {
  const user = await requireUser();
  const data = await getCatchUpForUser(user.id);

  return (
    <>
      <MobileCatchUp
        user={{ id: user.id, name: user.name, role: user.role }}
        data={data}
      />
      <div className="hidden md:flex flex-1 flex-col">
        <DesktopCatchUp data={data} />
      </div>
    </>
  );
}
