import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { TEACHER_RESULTS_PATH } from "@/features/results/constants";
import { SchoolResults } from "@/features/results/school-results";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { listTeacherResultSets } from "@/services/results";

export const metadata: Metadata = {
  title: "Results",
  description: "Test results for your assigned classes.",
};

export default async function ResultsPage() {
  await verifyTeacherSession();
  const resultSets = await listTeacherResultSets();

  return (
    <>
      <PageHero
        title={
          <>
            Exam <span className="text-gradient">Results</span>
          </>
        }
      />

      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SchoolResults resultSets={resultSets} basePath={TEACHER_RESULTS_PATH} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
