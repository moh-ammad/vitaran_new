import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/page-header";
import { hasListFilters, parseListFilters } from "@/features/documents/list-filters";
import { ListFiltersBar } from "@/features/documents/list-filters-bar";
import { RESULT_UPLOAD_PATH } from "@/features/results/constants";
import { ResultsTable } from "@/features/results/results-table";
import { listResultSets } from "@/services/results";
import { listSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Results" };

export default async function AdminResultsPage({ searchParams }: PageProps<"/admin/results">) {
  const filters = parseListFilters(await searchParams);
  const [resultSets, schools] = await Promise.all([listResultSets(filters), listSchoolOptions()]);

  return (
    <>
      <PageHeader
        title="Results"
        count={resultSets.length}
        toolbar={<ListFiltersBar filters={filters} schools={schools} />}
        actions={
          <Link
            href={RESULT_UPLOAD_PATH}
            className={buttonVariants({ className: "h-10 rounded-lg bg-brand-900 px-4 text-white hover:bg-brand-800" })}
          >
            <Upload />
            Upload results
          </Link>
        }
      />
      <ResultsTable
        resultSets={resultSets}
        uploadHref={RESULT_UPLOAD_PATH}
        filtered={hasListFilters(filters)}
      />
    </>
  );
}
