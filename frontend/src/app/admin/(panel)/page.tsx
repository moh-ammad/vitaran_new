import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, KeyRound, Plus, School, Trophy, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Meter, Panel, StatCard, SummaryTile } from "@/features/admin/dashboard-parts";
import { PageHeader } from "@/features/admin/page-header";
import { RESULT_UPLOAD_PATH } from "@/features/results/constants";
import { BOARD_LABELS, PROGRAM_LABELS } from "@/features/schools/constants";
import { SchoolStatusBadge } from "@/features/schools/school-status-badge";
import { SchoolTypeBadge } from "@/features/schools/school-type-badge";
import { getAnswerKeyStats } from "@/services/answer-keys";
import { getResultStats } from "@/services/results";
import { getSchoolStats } from "@/services/schools";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

const HEAD = "h-10 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase";

/** One colour per program, in the brand's blues. */
const PROGRAM_COLORS = ["bg-brand-900", "bg-blue-600", "bg-sky-400", "bg-brand-400"];

const VIEW_ALL =
  "inline-flex h-8 items-center rounded-lg border border-brand-200 px-3 text-xs font-semibold text-brand-900 transition-colors hover:bg-brand-50";

const hiddenCount = ({ total, published }: { total: number; published: number }) => total - published;

export default async function AdminDashboardPage() {
  const [stats, answerKeys, results] = await Promise.all([
    getSchoolStats(),
    getAnswerKeyStats(),
    getResultStats(),
  ]);
  const activeShare = stats.total === 0 ? 0 : Math.round((stats.active / stats.total) * 100);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live overview of schools and the content shared with them."
        actions={
          <>
            <Link
              href={RESULT_UPLOAD_PATH}
              className={buttonVariants({
                variant: "outline",
                className: "h-10 rounded-lg border-brand-200 px-4 text-brand-900 hover:bg-brand-50",
              })}
            >
              <Upload />
              Upload results
            </Link>
            <Link
              href="/admin/schools/new"
              className={buttonVariants({ className: "h-10 rounded-lg bg-brand-900 px-4 text-white hover:bg-brand-800" })}
            >
              <Plus />
              Register school
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Total schools"
          value={stats.total}
          hint={`${stats.active} active · ${stats.inactive} inactive`}
          icon={School}
          href="/admin/schools"
        />
        <StatCard
          label="Active schools"
          value={stats.active}
          hint={`${activeShare}% of all schools`}
          icon={CheckCircle2}
          href="/admin/schools?status=ACTIVE"
        />
        <StatCard
          label="Answer keys"
          value={answerKeys.total}
          hint={`${answerKeys.published} published · ${hiddenCount(answerKeys)} hidden`}
          icon={KeyRound}
          href="/admin/answer-keys"
        />
        <StatCard
          label="Results"
          value={results.total}
          hint={`${results.published} published · ${hiddenCount(results)} hidden`}
          icon={Trophy}
          href="/admin/results"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="School overview" description="Status and type of every registered school." className="lg:col-span-2">
          <div className="space-y-4">
            <Meter label="Active" value={stats.active} max={stats.total} color="bg-brand-900" />
            <Meter label="Inactive" value={stats.inactive} max={stats.total} color="bg-neutral-400" />
            <div className="border-t border-brand-100 pt-4" />
            <Meter label="Regular" value={stats.regular} max={stats.total} color="bg-blue-600" />
            <Meter label="Customized" value={stats.customized} max={stats.total} color="bg-sky-400" />
          </div>
        </Panel>

        <Panel
          title="Program enrolment"
          description="Schools enrolled in each program."
          className="lg:col-span-3"
          action={
            <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">
              {stats.byProgram.length} programs
            </span>
          }
        >
          <div className="space-y-4">
            {stats.byProgram.map((row, index) => (
              <Meter
                key={row.program}
                label={PROGRAM_LABELS[row.program]}
                value={row.count}
                max={stats.total}
                color={PROGRAM_COLORS[index % PROGRAM_COLORS.length]}
              />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-brand-100 pt-5 sm:grid-cols-4">
            <SummaryTile label="Regular schools" value={stats.regular} />
            <SummaryTile label="Customized schools" value={stats.customized} />
            <SummaryTile label="Published keys" value={answerKeys.published} />
            <SummaryTile label="Published results" value={results.published} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel
          title="Recently registered"
          description="The latest schools added to the platform."
          className="lg:col-span-3"
          action={
            <Link href="/admin/schools" className={VIEW_ALL}>
              View all
            </Link>
          }
        >
          {stats.recent.length > 0 ? (
            <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
              <Table>
                <TableHeader className="bg-neutral-50/80">
                  <TableRow className="border-brand-100 hover:bg-transparent">
                    <TableHead className={cn(HEAD, "pl-5 sm:pl-6")}>School</TableHead>
                    <TableHead className={cn(HEAD, "hidden sm:table-cell")}>Board</TableHead>
                    <TableHead className={cn(HEAD, "hidden md:table-cell")}>Type</TableHead>
                    <TableHead className={HEAD}>Status</TableHead>
                    <TableHead className={cn(HEAD, "hidden pr-5 sm:pr-6 md:table-cell")}>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent.map((school) => (
                    <TableRow key={school.id} className="border-brand-100/70 hover:bg-brand-50/30">
                      <TableCell className="max-w-64 py-3 pl-5 sm:pl-6">
                        <Link
                          href={`/admin/schools/${school.id}`}
                          className="block truncate text-sm font-semibold text-neutral-950 hover:underline"
                        >
                          {school.name}
                        </Link>
                        <span className="text-xs text-neutral-500">
                          {school.city}, {school.state}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-neutral-700 sm:table-cell">
                        {BOARD_LABELS[school.board]}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <SchoolTypeBadge type={school.type} size="sm" />
                      </TableCell>
                      <TableCell>
                        <SchoolStatusBadge status={school.status} />
                      </TableCell>
                      <TableCell className="hidden pr-5 text-sm text-neutral-600 sm:pr-6 md:table-cell">
                        {formatDate(school.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <School />
                </EmptyMedia>
                <EmptyTitle>No schools yet</EmptyTitle>
                <EmptyDescription>Registered schools will appear here.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/admin/schools/new" className={buttonVariants({ size: "sm" })}>
                  <Plus />
                  Register school
                </Link>
              </EmptyContent>
            </Empty>
          )}
        </Panel>

        <Panel title="Schools by board" description="Distribution across curricula." className="lg:col-span-2">
          {stats.byBoard.length > 0 ? (
            <div className="space-y-4">
              {stats.byBoard.map((row) => (
                <Meter key={row.board} label={BOARD_LABELS[row.board]} value={row.count} max={stats.total} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No schools yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
