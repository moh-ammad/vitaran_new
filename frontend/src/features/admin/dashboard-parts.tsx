import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

const SURFACE = "rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgb(25_28_95/0.04)]";

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  href: string;
  /** The headline card gets a soft brand tint. */
  highlight?: boolean;
};

export function StatCard({ label, value, hint, icon: Icon, href, highlight = false }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        SURFACE,
        "group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_12px_28px_-16px_rgb(25_28_95/0.35)]",
        highlight && "border-brand-200 bg-brand-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-brand-800",
            highlight ? "bg-white" : "bg-brand-50",
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="-mt-1 text-3xl font-bold text-neutral-950 tabular-nums">{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
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
  className?: string;
  children: ReactNode;
};

export function Panel({ title, description, action, className, children }: PanelProps) {
  return (
    <section className={cn(SURFACE, "p-5 sm:p-6", className)}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-neutral-950">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
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
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-neutral-900">{label}</span>
        <span className="font-semibold text-neutral-900 tabular-nums">{formatNumber(value)}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2.5 overflow-hidden rounded-full bg-neutral-100"
      >
        <div className={cn("h-full rounded-full transition-[width]", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-neutral-950 tabular-nums">{formatNumber(value)}</p>
    </div>
  );
}
