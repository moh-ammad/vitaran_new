import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import type { Program } from "@/types/school";
import { programs } from "./content";
import { ProgramTabs } from "./program-tabs";
import type { SolutionBook } from "./solution-books";

type ResourcePageProps = {
  title: string;
  highlight: string;
  books: Record<string, SolutionBook[]>;
  /** Programs the signed-in school has been given; others are never sent to the browser. */
  programIds: Program[];
  label: string;
  emptyMessage: string;
};

export function ResourcePage({
  title,
  highlight,
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
      />

      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <ProgramTabs
              programIds={programIds}
              books={allowedBooks}
              label={label}
              emptyMessage={emptyMessage}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
