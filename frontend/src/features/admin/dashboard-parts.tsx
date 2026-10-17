import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

const SURFACE = "rounded-2xl border border-neutral-200 bg-white shadow-sm";

type StatCardProps = {
  label: string;
  value?: number;
  hint: string;
  icon: LucideIcon;
  href: string;
};

export function StatCard({ label, value, hint, icon: Icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(SURFACE, "group flex flex-col p-5 transition-shadow hover:border-brand-200 hover:shadow-md")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-700">{label}</p>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white">
          <Icon className="size-5" />
        </span>
      </div>
      {value !== undefined && (
        <p className="-mt-1 text-3xl font-bold text-neutral-950 tabular-nums">{formatNumber(value)}</p>
      )}
      <p className={cn("text-xs text-neutral-500", value === undefined ? "mt-2" : "mt-1")}>{hint}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-900">
        View
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

type PanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
  children: ReactNode;
};

export function Panel({ title, description, action, compact, className, children }: PanelProps) {
  return (
    <section className={cn(SURFACE, "flex flex-col", compact ? "p-4" : "p-5 sm:p-6", className)}>
      <header className={cn("flex items-start justify-between gap-3", compact ? "mb-3" : "mb-5")}>
        <div>
          <h2 className={cn("font-bold text-neutral-950", compact ? "text-sm" : "text-base")}>{title}</h2>
          {description && (
            <p className={cn("mt-0.5 text-neutral-500", compact ? "text-xs" : "text-sm")}>{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

type MeterProps = {
  label: string;
  value: number;
  /** The bar is full at this value. */
  max: number;
  /** Tailwind background class for the filled part. */
  color?: string;
};

export function Meter({ label, value, max, color = "bg-brand-900" }: MeterProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-neutral-900">{label}</span>
        <span className="font-semibold text-neutral-900 tabular-nums">{formatNumber(value)}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 overflow-hidden rounded-full bg-neutral-100"
      >
        <div className={cn("h-full rounded-full transition-[width]", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="text-lg font-bold text-neutral-950 tabular-nums">{formatNumber(value)}</p>
    </div>
  );
}
