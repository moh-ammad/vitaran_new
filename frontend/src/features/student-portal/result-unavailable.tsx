import Link from "next/link";
import { EyeOff } from "lucide-react";

export function ResultUnavailable() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-900 text-white">
        <EyeOff className="size-5" />
      </span>
      <p className="text-base font-semibold text-neutral-950">This result isn&apos;t available</p>
      <p className="max-w-sm text-sm text-brand-700">
        Your class teacher hasn&apos;t published it yet, or has taken it back for corrections.
      </p>
      <Link
        href="/student/results"
        className="mt-2 inline-flex h-9 items-center rounded-lg bg-brand-900 px-3 text-sm font-semibold text-white hover:bg-brand-950"
      >
        Back to results
      </Link>
    </div>
  );
}
