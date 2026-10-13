import { redirect } from "next/navigation";
import { answerKeyEditHref } from "@/features/answer-keys/constants";

/** Breadcrumbs link here; an answer key has no separate details view. */
export default async function AnswerKeyPage({ params }: PageProps<"/admin/answer-keys/[id]">) {
  redirect(answerKeyEditHref((await params).id));
}
