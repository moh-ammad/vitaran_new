import type { Metadata } from "next";
import { ResourcePage } from "@/features/teachers-resources/resource-page";
import { answerKeys } from "@/features/teachers-resources/solution-books";

export const metadata: Metadata = {
  title: "Answer Keys",
  description:
    "Answer keys for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default function AnswerKeysPage() {
  return (
    <ResourcePage
      title="Answer"
      highlight="Keys"
      subtitle="Please navigate through the below tabs for Answer Keys"
      books={answerKeys}
      label="Answer Keys"
      emptyMessage="Answer keys for this program will be available here soon."
    />
  );
}
