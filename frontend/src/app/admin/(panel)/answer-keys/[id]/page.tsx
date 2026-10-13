import { redirect } from "next/navigation";
import { ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { documentEditHref } from "@/features/documents/constants";

/** Breadcrumbs link here; an answer key has no separate details view. */
export default async function AnswerKeyPage({ params }: PageProps<"/admin/answer-keys/[id]">) {
  redirect(documentEditHref(ANSWER_KEYS_PATH, (await params).id));
}
