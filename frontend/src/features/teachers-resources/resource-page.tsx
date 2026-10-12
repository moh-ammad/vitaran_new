import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { ProgramTabs } from "./program-tabs";
import type { SolutionBook } from "./solution-books";

type ResourcePageProps = {
  title: string;
  highlight: string;
  subtitle: string;
  books: Record<string, SolutionBook[]>;
  label: string;
  emptyMessage: string;
};

export function ResourcePage({
  title,
  highlight,
  subtitle,
  books,
  label,
  emptyMessage,
}: ResourcePageProps) {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950 pt-28 pb-12 text-white sm:pt-32 sm:pb-14">
        <div className="bg-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -top-40 left-1/2 -z-10 size-160 -translate-x-1/2 rounded-full bg-brand-700/40 blur-[140px]" />

        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-5xl">
            {title} <span className="text-gradient">{highlight}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-brand-200/85 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <ProgramTabs
              books={books}
              label={label}
              emptyMessage={emptyMessage}
            />
          </Reveal>

          <Reveal className="mt-16">
            <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-brand-800 to-brand-950 p-10 text-white sm:p-12">
              <div className="bg-grid absolute inset-0 opacity-60" />
              <div className="absolute -right-20 -bottom-20 size-72 rounded-full bg-glow/25 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    Need something specific?
                  </h2>
                  <p className="mt-2 max-w-lg text-brand-200/85">
                    Tell us your grade, subject and topic, and our team will
                    help you find the right material.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition-all hover:bg-brand-100 active:scale-95"
                >
                  Contact us
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
