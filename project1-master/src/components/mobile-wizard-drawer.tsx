"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type WizardContext = {
  goTo: (id: string) => void;
  back: () => void;
  close: () => void;
  current: string;
};

export type WizardStep = {
  id: string;
  title?: string;
  subtitle?: string;
  render: (ctx: WizardContext) => React.ReactNode;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep: string;
  steps: WizardStep[];
};

export function MobileWizardDrawer({
  open,
  onOpenChange,
  initialStep,
  steps,
}: Props) {
  const [stack, setStack] = useState<string[]>([initialStep]);
  const currentId = stack[stack.length - 1] ?? initialStep;
  const current = steps.find((s) => s.id === currentId) ?? steps[0];

  const innerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const titleId = useId();

  // Track viewport so drag-to-close only fires on mobile (the floating
  // desktop modal closes via X or backdrop click instead).
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset stack a beat after fully closed
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStack([initialStep]);
        setDragOffset(0);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [open, initialStep]);

  // Body scroll lock + ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  // Measure inner wrapper height so the section animates around it
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      setContentHeight(el.offsetHeight);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [currentId, open]);

  const ctx: WizardContext = {
    current: currentId,
    goTo: useCallback((id: string) => setStack((s) => [...s, id]), []),
    back: useCallback(
      () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      [],
    ),
    close: useCallback(() => onOpenChange(false), [onOpenChange]),
  };

  const canBack = stack.length > 1;

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isMobile) return;
    dragStartY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isMobile || dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current;
    setDragOffset(Math.max(0, dy));
  }
  function onPointerUp() {
    if (!isMobile) return;
    if (dragOffset > 100) onOpenChange(false);
    setDragOffset(0);
    dragStartY.current = null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        data-open={open}
        onClick={() => onOpenChange(false)}
        className="halo-wizard-backdrop"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-open={open}
        className="halo-wizard-drawer flex flex-col"
        style={{
          height: contentHeight !== null && open ? `${contentHeight}px` : "auto",
          ...(dragOffset > 0
            ? ({ "--halo-drag-y": `${dragOffset}px` } as React.CSSProperties)
            : null),
        }}
      >
        {/* Inner wrapper — its full height is what the section animates around */}
        <div ref={innerRef} className="flex flex-col">
          {/* Drag handle (mobile only) */}
          <div
            className="flex cursor-grab justify-center px-4 py-2.5 active:cursor-grabbing flex-shrink-0 md:hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: "none" }}
          >
            <div className="h-1 w-9 rounded-full bg-white/25" />
          </div>

          {/* Header */}
          {(current?.title || canBack) && (
            <div className="flex items-center gap-3 px-4 pb-3 pt-3 md:pt-5 flex-shrink-0">
              {canBack ? (
                <button
                  type="button"
                  onClick={ctx.back}
                  aria-label="Back"
                  className="grid h-8 w-8 place-items-center rounded-full flex-shrink-0 transition active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              ) : (
                <span className="h-8 w-8 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-center">
                {current?.subtitle && (
                  <p
                    className="truncate text-[10.5px] font-semibold"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {current.subtitle}
                  </p>
                )}
                {current?.title && (
                  <h2
                    id={titleId}
                    className="truncate text-[16px] font-semibold text-white"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {current.title}
                  </h2>
                )}
              </div>
              <button
                type="button"
                onClick={ctx.close}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full flex-shrink-0 transition active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-3.5 pb-[calc(18px+env(safe-area-inset-bottom))] md:pb-5">
            {current?.render(ctx)}
          </div>
        </div>
      </section>
    </>
  );
}
