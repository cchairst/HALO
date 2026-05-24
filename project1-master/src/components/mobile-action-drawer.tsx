"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type MobileActionDrawerProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  trigger: (open: () => void) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
};

export function MobileActionDrawer({
  title,
  subtitle,
  defaultOpen = false,
  trigger,
  children,
}: MobileActionDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [offset, setOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setOffset(0);
  }, []);

  useEffect(() => {
    if (!defaultOpen) return;
    const frame = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, [defaultOpen]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    startYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (startYRef.current === null) return;
    setOffset(Math.max(0, event.clientY - startYRef.current));
  }

  function onPointerUp() {
    if (offset > 90) {
      close();
      return;
    }
    setOffset(0);
    startYRef.current = null;
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={close}
        className={[
          "fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 md:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[84dvh] flex-col rounded-t-[28px] border-t md:hidden",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        style={{
          background: "#050506",
          borderColor: "rgba(255,255,255,0.1)",
          transform: open
            ? `translateY(${offset}px)`
            : offset
              ? `translateY(calc(100% + ${offset}px))`
              : undefined,
        }}
      >
        <div
          className="flex cursor-grab justify-center px-4 py-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "none" }}
        >
          <div className="h-1 w-9 rounded-full bg-white/25" />
        </div>
        <div className="flex items-start gap-3 px-4 pb-3">
          <div className="min-w-0 flex-1 text-center">
            <h2
              id={titleId}
              className="text-[17px] font-semibold tracking-[-0.02em] text-white"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[12px] text-white/45">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[18px] leading-none text-white/70"
          >
            x
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-[calc(18px+env(safe-area-inset-bottom))]">
          {typeof children === "function" ? children(close) : children}
        </div>
      </section>
    </>
  );
}

export function MobileDrawerTrigger({
  label,
  onClick,
  tone = "gold",
  ariaLabel,
}: {
  label: string;
  onClick: () => void;
  tone?: "gold" | "ghost";
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className="rounded-full bg-transparent px-3 py-1.5 text-[12px] font-medium active:scale-95"
      style={
        tone === "ghost"
          ? { border: "0.5px solid rgba(255,255,255,0.14)", color: "#fff" }
          : { border: "0.5px solid #d4a847", color: "#d4a847" }
      }
    >
      {label}
    </button>
  );
}
