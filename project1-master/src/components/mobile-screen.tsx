import Link from "next/link";

type Action = {
  href?: string;
  label: string;
  tone?: "ghost" | "gold";
};

export function MobileScreenHeader({
  back,
  title,
  subtitle,
  action,
  actionSlot,
}: {
  back?: { href: string; label?: string };
  title: string;
  subtitle?: string;
  action?: Action;
  actionSlot?: React.ReactNode;
}) {
  return (
    <div className="md:hidden flex items-center gap-2.5 px-4 pb-3 pt-3">
      {back ? (
        <Link
          href={back.href}
          aria-label={back.label ?? "Back"}
          className="grid h-8 w-8 place-items-center rounded-full text-[18px]"
          style={{ border: "0.5px solid rgba(255,255,255,0.14)", color: "#fff" }}
        >
          ‹
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-medium text-white">{title}</div>
        {subtitle && (
          <div className="text-[11px]" style={{ color: "#6e6e6e" }}>
            {subtitle}
          </div>
        )}
      </div>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="rounded-full bg-transparent px-3 py-1.5 text-[12px] font-medium"
            style={
              action.tone === "ghost"
                ? { border: "0.5px solid rgba(255,255,255,0.14)", color: "#fff" }
                : { border: "0.5px solid #d4a847", color: "#d4a847" }
            }
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            className="rounded-full bg-transparent px-3 py-1.5 text-[12px] font-medium"
            style={
              action.tone === "ghost"
                ? { border: "0.5px solid rgba(255,255,255,0.14)", color: "#fff" }
                : { border: "0.5px solid #d4a847", color: "#d4a847" }
            }
          >
            {action.label}
          </button>
        ))}
      {actionSlot}
    </div>
  );
}

export function MobileSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="md:hidden flex items-center gap-1 px-3.5 pb-1 pt-3 text-[11px] font-medium"
        style={{
          color: "#8a8a8a",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {label}
      </div>
      <div className="md:hidden">{children}</div>
    </>
  );
}

export function MobileRow({
  href,
  leading,
  title,
  subtitle,
  trailing,
}: {
  href?: string;
  leading: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const content = (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
      <div className="flex-shrink-0">{leading}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-white">{title}</div>
        {subtitle && (
          <div className="truncate text-[12px]" style={{ color: "#8a8a8a" }}>
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  );
  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}

export function MobileScreenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="md:hidden -mx-4 min-h-[100dvh] pb-[120px] text-white"
      style={{
        background: "#0a0a0c",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </div>
  );
}
