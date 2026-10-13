import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Plus,
  School,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/features/admin/page-header";
import { BOARD_LABELS, PROGRAM_LABELS } from "@/features/schools/constants";
import { SchoolStatusBadge } from "@/features/schools/school-status-badge";
import { getAnswerKeyStats } from "@/services/answer-keys";
import { getSchoolStats } from "@/services/schools";
import { formatDate, formatNumber } from "@/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  href: string;
};

function StatCard({ label, value, hint, icon: Icon, href }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold text-brand-900">
          {formatNumber(value)}
        </CardTitle>
        <CardAction>
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-800 text-white">
            <Icon className="size-5" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
        {hint}
        <Link href={href} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
          View
          <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const [stats, { total: answerKeyCount }] = await Promise.all([
    getSchoolStats(),
    getAnswerKeyStats(),
  ]);
  const percent = (count: number) => (stats.total === 0 ? 0 : Math.round((count / stats.total) * 100));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of schools and published content."
        actions={
          <Link href="/admin/schools/new" className={buttonVariants()}>
            <Plus />
            Register school
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total schools" value={stats.total} hint={`${stats.inactive} inactive`} icon={School} href="/admin/schools" />
        <StatCard label="Active schools" value={stats.active} hint={`${percent(stats.active)}% of all schools`} icon={CheckCircle2} href="/admin/schools?status=ACTIVE" />
        <StatCard label="Answer keys" value={answerKeyCount} hint="Published files" icon={KeyRound} href="/admin/answer-keys" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recently registered</CardTitle>
            <CardDescription>The latest schools added to the platform.</CardDescription>
            <CardAction>
              <Link href="/admin/schools" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {stats.recent.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">School</TableHead>
                    <TableHead className="hidden sm:table-cell">Board</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden pr-4 md:table-cell">Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="max-w-64 pl-4">
                        <Link href={`/admin/schools/${school.id}`} className="block truncate font-medium text-brand-900 hover:underline">
                          {school.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {school.city}, {school.state}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{BOARD_LABELS[school.board]}</Badge>
                      </TableCell>
                      <TableCell>
                        <SchoolStatusBadge status={school.status} />
                      </TableCell>
                      <TableCell className="hidden pr-4 text-muted-foreground md:table-cell">
                        {formatDate(school.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="py-10">
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schools by board</CardTitle>
              <CardDescription>Distribution across curricula.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.byBoard.length > 0 ? (
                stats.byBoard.map((row) => (
                  <Progress key={row.board} value={percent(row.count)}>
                    <ProgressLabel>{BOARD_LABELS[row.board]}</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">{row.count}</span>
                  </Progress>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Program enrolment</CardTitle>
              <CardDescription>Schools enrolled in each program.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.byProgram.map((row) => (
                <Progress key={row.program} value={percent(row.count)}>
                  <ProgressLabel className="truncate">{PROGRAM_LABELS[row.program]}</ProgressLabel>
                  <span className="ml-auto text-sm text-muted-foreground tabular-nums">{row.count}</span>
                </Progress>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
