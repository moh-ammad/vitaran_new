import type { Metadata } from "next";
import { FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { ResultLookup } from "@/features/results/result-lookup";

export const metadata: Metadata = {
  title: "Results",
  description: "Check your exam results with your roll number.",
};

const notes = [
  {
    icon: FileSearch,
    title: "Keep your roll number ready",
    description: "You'll find it on your hall ticket or admit card.",
  },
  {
    icon: ShieldCheck,
    title: "Your results are private",
    description: "Results are only shown when roll number and date of birth match.",
  },
];

export default function ResultsPage() {
  return (
    <section className="relative isolate min-h-dvh overflow-hidden bg-brand-950 pt-32 pb-24 text-white sm:pt-40">
      <div className="bg-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 size-200 -translate-x-1/2 rounded-full bg-brand-700/40 blur-[140px]" />

      <div className="mx-auto grid max-w-6xl items-start gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:pt-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-brand-200">
            <Sparkles className="size-3.5 text-glow" />
            Student results
          </p>
          <h1 className="mt-7 text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Check your <span className="text-gradient">exam results</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-brand-200/85">
            Enter your roll number and date of birth to view your results.
          </p>

          <ul className="mt-10 space-y-5">
            {notes.map((note) => (
              <li key={note.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <note.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{note.title}</span>
                  <span className="block text-sm text-brand-300">
                    {note.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ResultLookup />
      </div>
    </section>
  );
}
