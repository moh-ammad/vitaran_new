import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Contact, MapPin, School, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOARD_LABELS, PROGRAM_LABELS, STATUS_LABELS } from "@/features/schools/constants";
import { CopyButton } from "@/features/schools/copy-button";
import { SchoolDetailActions } from "@/features/schools/school-detail-actions";
import { getSchool } from "@/services/schools";
import { formatDateTime, formatNumber } from "@/utils/format";

export const metadata: Metadata = { title: "School Details" };

const EMPTY = "—";

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-brand-200 bg-white shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)]">
      <h2 className="flex items-center gap-2.5 border-b border-brand-100 bg-brand-50/60 px-4 py-2 text-sm font-semibold text-brand-950">
        <span className="flex size-6 items-center justify-center rounded-md border border-brand-200 bg-white text-brand-700 [&_svg]:size-3.5">
          {icon}
        </span>
        {title}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3 sm:grid-cols-3">{children}</dl>
    </section>
  );
}

function Field({ label, span, children }: { label: string; span?: 2 | 3; children: ReactNode }) {
  return (
    <div className={cn("min-w-0", span === 2 && "sm:col-span-2", span === 3 && "col-span-2 sm:col-span-3")}>
      <dt className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words text-neutral-950">{children ?? EMPTY}</dd>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-18 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-center">
      <p className="text-[9px] font-semibold tracking-wider text-white/50 uppercase">{label}</p>
      <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

export default async function SchoolDetailsPage({ params }: PageProps<"/admin/schools/[id]">) {
  const { id } = await params;
  const school = await getSchool(id);
  if (!school) notFound();

  return (
    <div className="space-y-3">
      <header className="flex flex-col gap-4 rounded-xl border border-brand-700 bg-linear-to-r from-brand-800 to-brand-950 px-5 py-4 text-white shadow-[0_10px_30px_-12px_rgb(25_28_95/0.55)] xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">School profile</p>
          <h1 className="mt-0.5 truncate text-xl font-bold sm:text-2xl">{school.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {school.addressLine}, {school.city}, {school.state}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip label="Code" value={school.code} />
          <Chip
            label="Status"
            value={
              <>
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    school.status === "ACTIVE" ? "bg-white" : "border border-white/50",
                  )}
                />
                {STATUS_LABELS[school.status]}
              </>
            }
          />
          <Chip label="Students" value={school.studentStrength ? formatNumber(school.studentStrength) : EMPTY} />
          <Chip label="Programs" value={school.programs.length} />
          <div className="flex gap-2 xl:ml-2 xl:border-l xl:border-white/15 xl:pl-4">
            <SchoolDetailActions school={school} inverted />
          </div>
        </div>
      </header>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <Panel title="School details" icon={<School />}>
            <Field label="School name">{school.name}</Field>
            <Field label="School code">{school.code}</Field>
            <Field label="Board">{BOARD_LABELS[school.board]}</Field>
            <Field label="School email">{school.accountEmail}</Field>
            <Field label="School mobile">{school.accountPhone}</Field>
            <Field label="Student strength">
              {school.studentStrength ? formatNumber(school.studentStrength) : null}
            </Field>
            <Field label="Principal">{school.principalName}</Field>
            <Field label="Programs" span={2}>
              {school.programs.length > 0
                ? school.programs.map((program) => PROGRAM_LABELS[program]).join(", ")
                : null}
            </Field>
          </Panel>

          <Panel title="Contact person" icon={<Contact />}>
            <Field label="Name">{school.contactName}</Field>
            <Field label="Mobile">{school.contactPhone}</Field>
            <Field label="Email">{school.contactEmail}</Field>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Address" icon={<MapPin />}>
            <Field label="Address" span={3}>
              {school.addressLine}
            </Field>
            <Field label="City">{school.city}</Field>
            <Field label="State">{school.state}</Field>
            <Field label="Pin code">{school.pincode}</Field>
          </Panel>

          <Panel title="Record" icon={<Clock />}>
            <Field label="Status">{STATUS_LABELS[school.status]}</Field>
            <Field label="Registered">{formatDateTime(school.createdAt)}</Field>
            <Field label="Last updated">{formatDateTime(school.updatedAt)}</Field>
          </Panel>

          <Panel title="Notes" icon={<StickyNote />}>
            <Field label="Internal notes" span={3}>
              {school.notes && <span className="whitespace-pre-line">{school.notes}</span>}
            </Field>
          </Panel>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-neutral-500 shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)]">
        <span>
          Login email: <span className="font-semibold text-neutral-950">{school.accountEmail ?? EMPTY}</span>
        </span>
        <span aria-hidden>·</span>
        <span>
          Phone: <span className="font-semibold text-neutral-950">{school.accountPhone ?? EMPTY}</span>
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          Password:
          {school.password ? (
            <>
              <span className="font-mono font-semibold text-neutral-950">{school.password}</span>
              <CopyButton value={school.password} label="Password" />
            </>
          ) : (
            <Link
              href={`/admin/schools/${school.id}/edit`}
              className="font-semibold text-neutral-950 underline underline-offset-4"
            >
              Set password
            </Link>
          )}
        </span>
      </footer>
    </div>
  );
}
