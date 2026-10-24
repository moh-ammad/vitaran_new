import { PageHeader } from "@/features/admin/page-header";
import { LiveRefresh } from "@/features/live/live-refresh";
import { StudentKeyReview } from "@/features/results/student-key-review";
import { ResultUnavailable } from "@/features/student-portal/result-unavailable";
import { formatDate } from "@/features/student-portal/types";
import { getStudentOmScanReview } from "@/services/om-scans";

export default async function StudentKeyReviewPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const scan = await getStudentOmScanReview(decodeURIComponent(testId));
  if (!scan) {
    return (
      <>
        <LiveRefresh kind="results" as="student" />
        <ResultUnavailable />
      </>
    );
  }

  return (
    <>
      <LiveRefresh kind="results" as="student" />
      <PageHeader
        title="Answer review"
        description={`Test ${scan.testNumber} · ID ${scan.testId} · ${formatDate(scan.examDate)} · ${scan.total}/${scan.maxTotal}`}
      />
      {scan.review && scan.review.length > 0 ? (
        <StudentKeyReview review={scan.review} />
      ) : (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-8 text-center text-sm text-brand-700">
          The answer key for this test is not available yet.
        </p>
      )}
    </>
  );
}
