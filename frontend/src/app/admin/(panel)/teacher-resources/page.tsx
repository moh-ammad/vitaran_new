import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/page-header";
import { ResourceLibrary } from "@/features/admin-resources/resource-library";
import { ResourceSummary } from "@/features/admin-resources/resource-summary";
import { solutionBooks } from "@/features/teachers-resources/solution-books";

export const metadata: Metadata = { title: "Teacher Resources" };

export default function AdminTeacherResourcesPage() {
  return (
    <>
      <PageHeader
        title="Teacher Resources"
        description="Solution books published on the public Teacher Resources page."
        actions={
          <a
            href="/teachers-resources"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink />
            View public page
          </a>
        }
      />
      <ResourceSummary books={solutionBooks} />
      <ResourceLibrary books={solutionBooks} label="Solution books" />
    </>
  );
}
