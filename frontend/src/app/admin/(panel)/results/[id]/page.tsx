import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { RESULTS_PATH, resultEditHref } from "@/features/results/constants";
import { ResultSetView, selectedClass } from "@/features/results/result-set-view";
import { getResultSet, getResultSheet } from "@/services/results";

export const metadata: Metadata = { title: "Results" };

export default async function ResultPage({ params, searchParams }: PageProps<"/admin/results/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const resultSet = await getResultSet(id);
  const classLevel = resultSet && selectedClass(resultSet, query.class);
  const sheet = classLevel ? await getResultSheet(id, classLevel) : null;
  if (!resultSet || !sheet) notFound();

  return (
    <ResultSetView
      resultSet={resultSet}
      sheet={sheet}
      basePath={RESULTS_PATH}
      showSchool
      backHref={RESULTS_PATH}
      actions={
        <Link
          href={resultEditHref(id)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-900 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <Pencil className="size-4" />
          Edit
        </Link>
      }
    />
  );
}
