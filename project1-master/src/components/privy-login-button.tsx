"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type PrivyLoginButtonLabels = {
  /** Default cta when SDK is ready and user is signed out. */
  signIn: string;
  /** While the Privy SDK is still bootstrapping. */
  loading: string;
  /** Already authenticated — about to bounce to /onboarding. */
  redirecting: string;
};

export function PrivyLoginButton({
  className,
  labels,
}: {
  className?: string;
  labels?: PrivyLoginButtonLabels;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authenticated, login } = usePrivy();
  const [pending] = useTransition();

  useEffect(() => {
    if (ready && authenticated) {
      // Preserve a service invite token across the sign-in bounce.
      const invite = searchParams.get("invite");
      const next = invite
        ? `/onboarding?invite=${encodeURIComponent(invite)}`
        : "/onboarding";
      router.push(next);
    }
  }, [ready, authenticated, router, searchParams]);

  function handle() {
    if (!ready) return;
    login();
  }

  const disabled = !ready || pending;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled}
      className={cn(
        "w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold tracking-tight transition",
        "bg-[var(--accent)] text-[var(--accent-fg)]",
        "hover:bg-[var(--accent-hover)] disabled:opacity-50",
        "border border-[rgba(246,189,71,0.48)]",
        className,
      )}
    >
      {!ready ? (
        <>
          <Loader2 className="size-4 animate-spin" /> {labels?.loading ?? "Loading..."}
        </>
      ) : authenticated ? (
        <>{labels?.redirecting ?? "Redirecting..."}</>
      ) : (
        <>
          {labels?.signIn ?? "Sign in / Sign up"}
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}
