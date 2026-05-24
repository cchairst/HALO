import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SP = Promise<{ recipient?: string; patient?: string }>;

// /resources is now folded into /recipients/[id]. Keep this route for
// backwards-compat redirects only.
export default async function ResourcesRedirect({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const id = sp.patient ?? sp.recipient;
  if (id) redirect(`/recipients/${id}`);
  redirect("/recipients");
}
