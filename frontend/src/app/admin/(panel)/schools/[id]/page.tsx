import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/features/admin/page-header";
import { BOARD_LABELS, PROGRAM_LABELS } from "@/features/schools/constants";
import { SchoolDetailActions } from "@/features/schools/school-detail-actions";
import { SchoolStatusBadge } from "@/features/schools/school-status-badge";
import { getSchool } from "@/services/schools";
import { formatDateTime, formatNumber } from "@/utils/format";

export const metadata: Metadata = { title: "School Details" };

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words text-brand-900">{children}</dd>
    </div>
  );
}

const notProvided = <span className="font-normal text-muted-foreground">Not provided</span>;

export default async function SchoolDetailsPage({ params }: PageProps<"/admin/schools/[id]">) {
  const { id } = await params;
  const school = await getSchool(id);
  if (!school) notFound();

  return (
    <>
      <PageHeader
        title={school.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{school.code}</span>
            <SchoolStatusBadge status={school.status} />
          </span>
        }
        actions={<SchoolDetailActions school={school} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <DetailRow label="Board">{BOARD_LABELS[school.board]}</DetailRow>
                <DetailRow label="Principal">{school.principalName ?? notProvided}</DetailRow>
                <DetailRow label="Student strength">
                  {school.studentStrength ? formatNumber(school.studentStrength) : notProvided}
                </DetailRow>
                <DetailRow label="Programs">
                  {school.programs.length > 0 ? (
                    <span className="flex flex-wrap gap-1.5">
                      {school.programs.map((program) => (
                        <Badge key={program} variant="secondary">
                          {PROGRAM_LABELS[program]}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    notProvided
                  )}
                </DetailRow>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <address className="text-sm leading-relaxed text-brand-900 not-italic">
                {school.addressLine}
                <br />
                {school.city}, {school.state} – {school.pincode}
              </address>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal only.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line text-brand-900">
                {school.notes ?? notProvided}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact person</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-brand-900">{school.contactName}</p>
              <a href={`mailto:${school.contactEmail}`} className="block text-brand-700 hover:underline">
                {school.contactEmail}
              </a>
              <a href={`tel:${school.contactPhone}`} className="block text-brand-700 hover:underline">
                {school.contactPhone}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Registered</p>
                <p className="font-medium text-brand-900">{formatDateTime(school.createdAt)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium text-brand-900">{formatDateTime(school.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
