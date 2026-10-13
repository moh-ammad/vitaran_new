import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SchoolAnswerKeys } from "@/features/answer-keys/school-answer-keys";
import { verifySchoolSession } from "@/features/school-auth/session";
import { ContactCta } from "@/features/teachers-resources/resource-page";
import { listSchoolAnswerKeys } from "@/services/school-answer-keys";

export const metadata: Metadata = {
  title: "Answer Keys",
  description:
    "Answer keys for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default async function AnswerKeysPage() {
  const [school, answerKeys] = await Promise.all([verifySchoolSession(), listSchoolAnswerKeys()]);

  return (
    <>
      <PageHero
        title={
          <>
            Answer <span className="text-gradient">Keys</span>
          </>
        }
        subtitle="Choose a program and class to open its answer keys."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SchoolAnswerKeys programIds={school.programs} answerKeys={answerKeys} />
          </Reveal>
          <ContactCta />
        </div>
      </section>
    </>
  );
}
