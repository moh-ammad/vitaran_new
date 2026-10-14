import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { LiveRefresh } from "@/features/live/live-refresh";
import { SCHOOL_RESULTS_PATH } from "@/features/results/constants";
import { ResultSetView, selectedClass } from "@/features/results/result-set-view";
import { getSchoolResultSet, getSchoolResultSheet } from "@/services/results";

export const metadata: Metadata = { title: "Results" };

export default async function SchoolResultPage({ params, searchParams }: PageProps<"/results/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const resultSet = await getSchoolResultSet(id);
  const classLevel = resultSet && selectedClass(resultSet, query.class);
  const sheet = classLevel ? await getSchoolResultSheet(id, classLevel) : null;
  if (!resultSet || !sheet) notFound();

  return (
    <>
      <LiveRefresh kind="results" />
      <PageHero
        title={
          <>
            Exam <span className="text-gradient">Results</span>
          </>
        }
      />

      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <ResultSetView
            resultSet={resultSet}
            sheet={sheet}
            basePath={SCHOOL_RESULTS_PATH}
            backHref={SCHOOL_RESULTS_PATH}
          />
        </div>
      </section>
    </>
  );
}
