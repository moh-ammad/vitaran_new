import type { Metadata } from "next";
import { verifySchoolSession } from "@/features/school-auth/session";
import { ResourcePage } from "@/features/teachers-resources/resource-page";
import { answerKeys } from "@/features/teachers-resources/solution-books";

export const metadata: Metadata = {
  title: "Answer Keys",
  description:
    "Answer keys for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default async function AnswerKeysPage() {
  const school = await verifySchoolSession();

  return (
    <ResourcePage
      title="Answer"
      highlight="Keys"
      subtitle="Please navigate through the below tabs for Answer Keys"
      books={answerKeys}
      programIds={school.programs}
      label="Answer Keys"
      emptyMessage="Answer keys for this program will be available here soon."
    />
  );
}
