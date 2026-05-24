"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Lock, Loader2 } from "lucide-react";
import { markIdleLock } from "@/app/actions";

// HIPAA's automatic-logoff standard (45 CFR 164.312(a)(2)(iii)) requires the
// session terminate after a period of inactivity, but it doesn't pick the
// number — most healthcare apps use 15-30 minutes. We use 30, which is the
// common ceiling for production EHRs. Active users never see this because
// any mouse / keyboard / touch event resets the timer; the lock only fires
// when the page is genuinely abandoned.
//
// "Locking" means: cover the page with a backdrop that hides all PHI, and
// require the user to click Resume. Resume checks the Privy session — if
// still valid, the overlay dismisses; otherwise we redirect to the landing
// page for a fresh sign-in. We deliberately don't force a hard logout on
// every idle — re-authenticating an existing session is a much better UX
// than emailing a one-time code every half hour.
const IDLE_LOCK_MS = 30 * 60 * 1000;

// Activity is dispatched aggressively (every mousemove fires). Throttle to
// at most once per 5s so we don't burn battery on debounced timers.
const ACTIVITY_THROTTLE_MS = 5_000;

// Server-side audit emit is fire-and-forget. We rate-limit it to once per
// lock event so a sleeping tab doesn't spam audit rows.
function emitIdleLockAudit(reason: "idle" | "manual") {
  // markIdleLock is a server action; void the promise to keep typing happy.
  void markIdleLock(reason).catch(() => {
    // The audit helper already swallows DB errors; the only failure path
    // here is a network drop. Safe to ignore — the lock UI still works.
  });
}

export function IdleLock() {
  const router = useRouter();
  const { ready, authenticated, getAccessToken, logout } = usePrivy();
  const [locked, setLocked] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  // Initialize to 0 so the first useEffect run sets the real timestamp.
  // Calling Date.now() directly in render is flagged by react-hooks/purity.
  const lastActivityAt = useRef<number>(0);

  useEffect(() => {
    // Don't arm the lock until Privy has finished hydrating; otherwise the
    // very first SSR render would tick the timer for a not-yet-authenticated
    // user and we'd cover the landing flow. Skip arming while already locked
    // so activity on the lock overlay itself doesn't keep rescheduling.
    if (!ready || !authenticated || locked) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleNextCheck() {
      if (timer) clearTimeout(timer);
      const remaining = Math.max(
        0,
        IDLE_LOCK_MS - (Date.now() - lastActivityAt.current),
      );
      timer = setTimeout(() => {
        if (Date.now() - lastActivityAt.current >= IDLE_LOCK_MS) {
          setLocked(true);
          emitIdleLockAudit("idle");
        } else {
          scheduleNextCheck();
        }
      }, remaining + 250);
    }

    function onActivity() {
      const now = Date.now();
      if (now - lastActivityAt.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityAt.current = now;
      scheduleNextCheck();
    }

    const windowEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    for (const ev of windowEvents)
      window.addEventListener(ev, onActivity, { passive: true });
    // visibilitychange lives on document, not window — when the user comes
    // back to a tab we want to count that as activity rather than tripping
    // the timer.
    document.addEventListener("visibilitychange", onActivity);

    lastActivityAt.current = Date.now();
    scheduleNextCheck();

    return () => {
      for (const ev of windowEvents) window.removeEventListener(ev, onActivity);
      document.removeEventListener("visibilitychange", onActivity);
      if (timer) clearTimeout(timer);
    };
  }, [ready, authenticated, locked]);

  async function resume() {
    setResuming(true);
    setResumeError(null);
    try {
      // Ask Privy to hand back an access token. If the session has aged out
      // server-side, this throws — we surface a clear "sign in again" path
      // instead of leaving the user staring at a spinner.
      const token = await getAccessToken();
      if (!token) {
        setResumeError("Your session expired. Please sign in again.");
        return;
      }
      lastActivityAt.current = Date.now();
      // Setting `locked` back to false re-arms the timer via useEffect.
      setLocked(false);
      router.refresh();
    } catch {
      setResumeError("Your session expired. Please sign in again.");
    } finally {
      setResuming(false);
    }
  }

  async function signOutFromLock() {
    try {
      await logout();
    } catch {
      // Ignore — still navigate so the user isn't stranded.
    }
    router.push("/");
    router.refresh();
  }

  if (!ready || !authenticated || !locked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="halo-idle-lock-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
      style={{
        // Solid backdrop, NOT translucent — we don't want PHI bleeding
        // through a blur layer to a shoulder-surfer at the desk.
        background: "rgba(15, 12, 8, 0.96)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--gold-soft)]">
            <Lock className="size-5" />
          </div>
          <div>
            <h2 id="halo-idle-lock-title" className="text-[17px] font-semibold tracking-tight text-[var(--ink)]">
              Session paused
            </h2>
            <p className="text-[12.5px] text-[var(--muted)]">
              For HIPAA compliance, we hide patient information when no one is
              actively using the page.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
          Click <span className="font-semibold">Resume</span> to keep going.
          If you&apos;re finished, sign out so the next person at this device
          starts with a clean session.
        </div>

        {resumeError && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
            {resumeError}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={signOutFromLock}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13.5px] font-semibold text-[var(--ink-2)] transition hover:bg-[var(--surface-2)]"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={resume}
            disabled={resuming}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[rgba(246,189,71,0.48)] bg-[var(--accent)] px-4 text-[13.5px] font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {resuming ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Resuming...
              </>
            ) : (
              "Resume"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
