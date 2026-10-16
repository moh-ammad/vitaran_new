import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { TEACHER_RESULTS_PATH } from "@/features/results/constants";
import { ResultSetView, selectedClass } from "@/features/results/result-set-view";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { getTeacherResultSet, getTeacherResultSheet } from "@/services/results";

export const metadata: Metadata = { title: "Results" };

export default async function TeacherResultPage({ params, searchParams }: PageProps<"/results/[id]">) {
  await verifyTeacherSession();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const resultSet = await getTeacherResultSet(id);
  const classLevel = resultSet && selectedClass(resultSet, query.class);
  const sheet = classLevel ? await getTeacherResultSheet(id, classLevel) : null;
  if (!resultSet || !sheet) notFound();

  return (
    <>
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
            basePath={TEACHER_RESULTS_PATH}
            backHref={TEACHER_RESULTS_PATH}
          />
        </div>
      </section>
    </>
  );
}
