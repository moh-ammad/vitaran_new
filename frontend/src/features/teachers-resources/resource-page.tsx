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

          <ContactCta />
        </div>
      </section>
    </>
  );
}

export function ContactCta() {
  return (
    <Reveal className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-linear-to-r from-brand-800 to-brand-950 px-8 py-6 text-white sm:px-10">
        <h2 className="text-lg font-semibold sm:text-xl">Need something specific?</h2>
        <Link
          href="/contact"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 transition-all hover:bg-brand-100 active:scale-95"
        >
          Contact us
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Reveal>
  );
}
