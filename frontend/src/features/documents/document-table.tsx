import Link from "next/link";
import { ExternalLink, FileText, ListChecks, Pencil, Upload } from "lucide-react";
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
import { programLabel } from "@/features/schools/constants";
import { SchoolTypeBadge } from "@/features/schools/school-type-badge";
import type { DeleteResult, PdfDocument, Publishable, SchoolRef } from "@/types/document";
import type { SchoolType } from "@/types/school";
import {
  capitalize,
  documentAnswersHref,
  documentEditHref,
  documentFileHref,
  formatFileSize,
  wasEdited,
} from "./constants";
import { DateTime } from "./date-time-cell";
import { DeleteDocumentButton } from "./delete-document-button";
import { PublishSwitch } from "./publish-switch";

const ROW_ACTION =
  "inline-flex size-8 items-center justify-center text-neutral-500 transition-colors hover:bg-brand-50 hover:text-brand-900 [&_svg]:size-4";

const NUMBER_PILL =
  "inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-brand-100 bg-brand-50 px-2 text-xs font-semibold text-brand-900 tabular-nums";

const HEAD = "h-10 px-2 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase";
const CELL = "min-w-0 px-2 py-2.5 align-middle";

type DocumentRow = PdfDocument & Publishable & {
  type?: SchoolType;
  school: SchoolRef | null;
  answerCount?: number;
  testId?: string;
};

type DocumentTableProps = {
  items: DocumentRow[];
  /** Lowercase, e.g. "answer key". */
  noun: string;
  /** Admin section, e.g. `/admin/answer-keys`. */
  basePath: string;
  uploadHref: string;
  /** Answer keys show whether they are regular or customized. */
  showType?: boolean;
  /** Admin-only: open the per-question answers editor. */
  showAnswersEdit?: boolean;
  /** The list is narrowed by filters, so an empty list means "no matches". */
  filtered?: boolean;
  publishAction: (id: string, published: boolean) => Promise<DeleteResult>;
  deleteAction: (id: string) => Promise<DeleteResult>;
};

export function DocumentTable({
  items,
  noun,
  basePath,
  uploadHref,
  showType = false,
  showAnswersEdit = false,
  filtered = false,
  publishAction,
  deleteAction,
}: DocumentTableProps) {
  return (
    <section className="w-full overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgb(25_28_95/0.04),0_12px_32px_-16px_rgb(25_28_95/0.18)]">
      {items.length > 0 ? (
        <Table className="w-full table-fixed" containerClassName="overflow-x-hidden">
          <colgroup>
            <col className="w-12" />
            <col className="w-20" />
            <col className="w-14" />
            <col className="hidden w-40 lg:table-column" />
            {showType ? <col className="w-24" /> : null}
            <col className="hidden w-28 md:table-column" />
            <col className="hidden w-[5.5rem] xl:table-column" />
            <col className="hidden w-[5.5rem] xl:table-column" />
            <col />
            <col className="w-36" />
            <col className="w-40" />
          </colgroup>
          <TableHeader className="bg-neutral-50/80">
            <TableRow className="border-brand-100 hover:bg-transparent">
              <TableHead className={cn(HEAD, "pl-3")}>Test</TableHead>
              <TableHead className={HEAD}>Test ID</TableHead>
              <TableHead className={cn(HEAD, "text-center")}>Class</TableHead>
              <TableHead className={cn(HEAD, "hidden lg:table-cell")}>Program</TableHead>
              {showType && <TableHead className={HEAD}>Type</TableHead>}
              <TableHead className={cn(HEAD, "hidden md:table-cell")}>School</TableHead>
              <TableHead className={cn(HEAD, "hidden xl:table-cell")}>Uploaded</TableHead>
              <TableHead className={cn(HEAD, "hidden xl:table-cell")}>Updated</TableHead>
              <TableHead className={HEAD}>{capitalize(noun)}</TableHead>
              <TableHead className={HEAD}>Schools</TableHead>
              <TableHead className={cn(HEAD, "pr-2 text-right")}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-brand-100/70 hover:bg-brand-50/30">
                <TableCell className={cn(CELL, "pl-3")}>
                  <span className="flex size-9 flex-col items-center justify-center rounded-lg bg-brand-900 text-white">
                    <span className="text-[8px] font-semibold tracking-wider text-white/70 uppercase">No</span>
                    <span className="text-sm leading-none font-bold tabular-nums">{item.testNumber}</span>
                  </span>
                </TableCell>
                <TableCell className={CELL}>
                  <span className="block truncate font-mono text-sm font-medium text-neutral-950" title={item.testId}>
                    {item.testId || "—"}
                  </span>
                </TableCell>
                <TableCell className={cn(CELL, "text-center")}>
                  <span className={NUMBER_PILL}>{item.classLevel}</span>
                </TableCell>
                <TableCell className={cn(CELL, "hidden lg:table-cell")}>
                  <span className="block truncate text-sm text-neutral-800" title={programLabel(item.program)}>
                    {programLabel(item.program)}
                  </span>
                </TableCell>
                {showType && item.type && (
                  <TableCell className={CELL}>
                    <SchoolTypeBadge type={item.type} size="sm" />
                  </TableCell>
                )}
                <TableCell className={cn(CELL, "hidden md:table-cell")}>
                  {item.school ? (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-950" title={item.school.name}>
                        {item.school.name}
                      </p>
                      <p className="truncate font-mono text-[11px] text-neutral-500">{item.school.code}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">All regular</span>
                  )}
                </TableCell>
                <TableCell className={cn(CELL, "hidden xl:table-cell")}>
                  <DateTime iso={item.createdAt} />
                </TableCell>
                <TableCell className={cn(CELL, "hidden xl:table-cell")}>
                  <DateTime iso={wasEdited(item) ? item.updatedAt : null} />
                </TableCell>
                <TableCell className={CELL}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-950" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {formatFileSize(item.fileSize)}
                        <span className="lg:hidden"> · {programLabel(item.program)}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn(CELL, "whitespace-nowrap")}>
                  <PublishSwitch
                    published={item.published}
                    label={item.fileName}
                    onToggle={publishAction.bind(null, item.id)}
                  />
                </TableCell>
                <TableCell className={cn(CELL, "pr-2")}>
                  <div className="ml-auto flex w-max shrink-0 divide-x divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                    <Link
                      href={documentFileHref(basePath, item.id)}
                      target="_blank"
                      rel="noreferrer"
                      prefetch={false}
                      title="Open PDF"
                      aria-label={`Open ${item.fileName}`}
                      className={ROW_ACTION}
                    >
                      <ExternalLink />
                    </Link>
                    {showAnswersEdit && (
                      <Link
                        href={documentAnswersHref(basePath, item.id)}
                        title="Edit answers"
                        aria-label={`Edit answers for ${item.fileName}`}
                        className={ROW_ACTION}
                      >
                        <ListChecks />
                      </Link>
                    )}
                    <Link
                      href={documentEditHref(basePath, item.id)}
                      title="Edit"
                      aria-label={`Edit ${item.fileName}`}
                      className={ROW_ACTION}
                    >
                      <Pencil />
                    </Link>
                    <DeleteDocumentButton
                      fileName={item.fileName}
                      noun={noun}
                      onDelete={deleteAction.bind(null, item.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : filtered ? (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No matching {noun}s</EmptyTitle>
            <EmptyDescription>Try another test, type or school.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No {noun}s yet</EmptyTitle>
            <EmptyDescription>Uploaded {noun}s will appear here with their date.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={uploadHref} className={buttonVariants({ size: "sm" })}>
              <Upload />
              Upload {noun}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </section>
  );
}
