import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { RESULTS_PATH, resultSetHref } from "@/features/results/constants";
import { ResultForm } from "@/features/results/result-form";
import { getResultSet } from "@/services/results";
import { listSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Edit Results" };

export default async function EditResultPage({ params }: PageProps<"/admin/results/[id]/edit">) {
  const { id } = await params;
  const [resultSet, schools] = await Promise.all([getResultSet(id), listSchoolOptions()]);
  if (!resultSet) notFound();

  return (
    <>
      <PageHeader
        title="Edit results"
        description="Change the details, replace a class's sheet, add missing classes or remove one."
      />
      <ResultForm schools={schools} resultSet={resultSet} backHref={resultSetHref(RESULTS_PATH, id)} />
    </>
  );
}
