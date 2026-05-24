"use client";

import { usePathname } from "next/navigation";
import { DesktopNavRail } from "./nav-rail";
import { DesktopSidebar, DesktopSidebarCatchUp } from "./sidebar";

// Replaces the old ServerRail + ChannelList desktop chrome. Picks the
// sidebar variant from the current route. On mobile both the nav rail and
// the sidebar are hidden — the page's existing mobile-* components take
// over inside `children`.

export function DesktopAppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname() ?? "";
  const variant = pickVariant(pathname);

  return (
    <div className="flex min-h-screen w-full">
      <DesktopNavRail initials={firstInitial(userName)} />

      {variant === "catch-up" ? (
        <DesktopSidebarCatchUp userName={userName} />
      ) : (
        <DesktopSidebar
          variant={variant}
          bottomLabel={variant === "patient-chart" ? "View all patients" : "View all chats"}
        />
      )}

      <div className="flex flex-1 flex-col min-w-0 mobile-app-shell">{children}</div>
    </div>
  );
}

function pickVariant(
  pathname: string,
): "shift-hub" | "chats" | "care-teams" | "patient-chart" | "catch-up" {
  if (pathname.startsWith("/catch-up")) return "catch-up";
  if (pathname.startsWith("/wellness")) return "shift-hub";
  if (pathname.startsWith("/messages")) return "chats";
  if (pathname.startsWith("/recipients/")) return "patient-chart";
  if (pathname.startsWith("/recipients")) return "care-teams";
  return "shift-hub";
}

function firstInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "C";
}
