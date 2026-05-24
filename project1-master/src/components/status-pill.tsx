import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Cross,
  Heart,
  Home as HomeIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  STATUS_META,
  isRecipientStatus,
  type RecipientStatus,
} from "@/lib/recipient-status";

const ICON: Record<RecipientStatus, LucideIcon> = {
  stable: Heart,
  monitoring: Activity,
  critical: AlertTriangle,
  ready_for_discharge: ClipboardCheck,
  discharged: HomeIcon,
  deceased: Cross,
};

export function StatusPill({
  status,
  className,
  withIcon = true,
}: {
  status: string;
  className?: string;
  withIcon?: boolean;
}) {
  const safe: RecipientStatus = isRecipientStatus(status) ? status : "stable";
  const meta = STATUS_META[safe];
  const Icon = ICON[safe];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ring-1 ring-inset",
        meta.pillBg,
        meta.pillText,
        meta.pillRing,
        className,
      )}
    >
      {withIcon && <Icon className="size-3" />}
      {meta.pillLabel ?? meta.label}
    </span>
  );
}
