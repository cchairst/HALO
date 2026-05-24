"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

// Wraps an interactive element (Halo header logo, "Cancel" link) that
// abandons an in-progress onboarding flow. Clearing Privy state is the
// load-bearing step — without it, navigating to "/" would just bounce
// the user straight back to /onboarding via PrivyLoginButton's useEffect
// (which runs whenever the SDK reports `authenticated`).
//
// We do navigate to "/" optimistically before awaiting Privy's logout
// resolution. If the SDK is mid-bootstrap, click feedback shouldn't be
// gated on an opaque async — the destination page (/) will still render
// the unauthenticated landing because `getCurrentUser` keys off the User
// row, not the Privy cookie.
export function OnboardingExit({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const { logout, ready } = usePrivy();
  const [pending, start] = useTransition();

  function abandon() {
    start(async () => {
      try {
        if (ready) await logout();
      } catch {
        // Swallow — we still want to navigate even if Privy logout chokes.
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={abandon}
      disabled={pending}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
