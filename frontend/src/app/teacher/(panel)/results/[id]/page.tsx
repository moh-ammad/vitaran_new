import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { TEACHER_RESULTS_PATH } from "@/features/results/constants";
import { ResultSetView, selectedClass } from "@/features/results/result-set-view";
import { getTeacherResultSet, getTeacherResultSheet } from "@/services/results";

export default async function TeacherResultDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ class?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const resultSet = await getTeacherResultSet(id);
  const classLevel = resultSet && selectedClass(resultSet, query.class);
  const sheet = classLevel ? await getTeacherResultSheet(id, classLevel) : null;
  if (!resultSet || !sheet) notFound();

  return (
    <>
      <PageHeader title="Result" />
      <ResultSetView
        resultSet={resultSet}
        sheet={sheet}
        basePath={TEACHER_RESULTS_PATH}
        backHref={TEACHER_RESULTS_PATH}
      />
    </>
  );
}
