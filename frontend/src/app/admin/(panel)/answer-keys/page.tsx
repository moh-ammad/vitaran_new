import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/page-header";
import { ResourceLibrary } from "@/features/admin-resources/resource-library";
import { ResourceSummary } from "@/features/admin-resources/resource-summary";
import { answerKeys } from "@/features/teachers-resources/solution-books";

export const metadata: Metadata = { title: "Answer Keys" };

export default function AdminAnswerKeysPage() {
  return (
    <>
      <PageHeader
        title="Answer Keys"
        description="Answer keys published on the public Answer Keys page."
        actions={
          <a
            href="/answer-keys"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink />
            View public page
          </a>
        }
      />
      <ResourceSummary books={answerKeys} />
      <ResourceLibrary books={answerKeys} label="Answer keys" />
    </>
  );
}
