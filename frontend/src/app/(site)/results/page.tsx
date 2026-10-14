import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { LiveRefresh } from "@/features/live/live-refresh";
import { SchoolResults } from "@/features/results/school-results";
import { listSchoolResultSets } from "@/services/results";

export const metadata: Metadata = {
  title: "Results",
  description: "Test results for your school, by program, test and class.",
};

export default async function ResultsPage() {
  const resultSets = await listSchoolResultSets();

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

      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SchoolResults resultSets={resultSets} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
