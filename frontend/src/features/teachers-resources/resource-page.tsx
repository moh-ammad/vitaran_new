import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import type { Program, Subject } from "@/types/school";
import { programs } from "./content";
import { ProgramTabs } from "./program-tabs";
import type { SolutionBook } from "./solution-books";

type ResourcePageProps = {
  title: string;
  highlight: string;
  books: Record<string, SolutionBook[]>;
  /** Programs and subjects the signed-in school has been given; other books are never sent to the browser. */
  programIds: Program[];
  subjectIds: Subject[];
  label: string;
  emptyMessage: string;
};

export function ResourcePage({
  title,
  highlight,
  books,
  programIds,
  subjectIds,
  label,
  emptyMessage,
}: ResourcePageProps) {
  const subjectLabels: string[] = subjectIds.map((subject) => SUBJECT_LABELS[subject]);

  const allowed = programs
    .filter((program) => programIds.includes(program.id))
    .map((program) => {
      const all = books[program.title] ?? [];
      return { program, all, visible: all.filter((book) => subjectLabels.includes(book.subject)) };
    })
    // Hide programs whose books are all in subjects the school wasn't given.
    .filter(({ all, visible }) => all.length === 0 || visible.length > 0);

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
              programIds={allowed.map(({ program }) => program.id)}
              books={Object.fromEntries(allowed.map(({ program, visible }) => [program.title, visible]))}
              label={label}
              emptyMessage={emptyMessage}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
