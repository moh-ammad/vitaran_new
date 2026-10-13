import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import type { Program } from "@/types/school";
import { programs } from "./content";
import { ProgramTabs } from "./program-tabs";
import type { SolutionBook } from "./solution-books";

type ResourcePageProps = {
  title: string;
  highlight: string;
  subtitle: string;
  books: Record<string, SolutionBook[]>;
  /** Programs the signed-in school has been given; others are never sent to the browser. */
  programIds: Program[];
  label: string;
  emptyMessage: string;
};

export function ResourcePage({
  title,
  highlight,
  subtitle,
  books,
  programIds,
  label,
  emptyMessage,
}: ResourcePageProps) {
  const allowedBooks = Object.fromEntries(
    programs
      .filter((program) => programIds.includes(program.id))
      .map((program) => [program.title, books[program.title] ?? []]),
  );

  return (
    <>
      <PageHero
        title={
          <>
            {title} <span className="text-gradient">{highlight}</span>
          </>
        }
        subtitle={subtitle}
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <ProgramTabs
              programIds={programIds}
              books={allowedBooks}
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
