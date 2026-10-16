import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

export type QuickLinkItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  hint?: string;
};

/** Compact mobile cards — 2-up grid of short redirects. */
export function QuickLinks({ items, className }: { items: QuickLinkItem[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2", className)}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex h-full flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-900 text-white">
                <item.icon className="size-3.5" />
              </span>
              {item.count !== undefined && (
                <span className="text-lg font-bold text-neutral-950 tabular-nums">
                  {formatNumber(item.count)}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-neutral-950">{item.label}</span>
              {item.hint && (
                <span className="mt-0.5 block truncate text-[11px] text-neutral-500">{item.hint}</span>
              )}
            </span>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-900">
              Open
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ChipRow({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">{title}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <li
              key={item}
              className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-900"
            >
              {item}
            </li>
          ))
        ) : (
          <li className="text-xs text-neutral-500">{empty}</li>
        )}
      </ul>
    </div>
  );
}
