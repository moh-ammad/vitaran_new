import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SchoolStatus } from "@/types/school";
import { STATUS_LABELS } from "./constants";

export function SchoolStatusBadge({ status }: { status: SchoolStatus }) {
  const active = status === "ACTIVE";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-brand-200 bg-brand-50 text-brand-500",
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", active ? "bg-emerald-500" : "bg-brand-400")}
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
