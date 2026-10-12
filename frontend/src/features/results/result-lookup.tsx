"use client";

import { useState, type FormEvent } from "react";
import { Info, Search } from "lucide-react";

const inputClasses =
  "mt-2 w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100";

export function ResultLookup() {
  const [submittedRoll, setSubmittedRoll] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmittedRoll(String(data.get("rollNumber") ?? "").trim());
  };

  return (
    <div className="rounded-3xl bg-white p-6 text-brand-900 shadow-2xl sm:p-8">
      <h2 className="text-xl font-bold">Find your result</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All fields are required.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Roll number</span>
          <input
            name="rollNumber"
            required
            inputMode="text"
            autoComplete="off"
            placeholder="e.g. VL2026-00123"
            className={inputClasses}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Date of birth</span>
          <input
            name="dateOfBirth"
            type="date"
            required
            className={inputClasses}
          />
        </label>

        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
        >
          <Search className="size-4" />
          Check result
        </button>
      </form>

      {submittedRoll !== null && (
        <div
          role="status"
          className="mt-6 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <p className="text-brand-700">
            Results for <span className="font-semibold">{submittedRoll}</span>{" "}
            are not published yet. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
}
