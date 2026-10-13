import Link from "next/link";
import { ExternalLink, FileText, Pencil, Upload } from "lucide-react";
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
import { PROGRAM_LABELS, TYPE_LABELS } from "@/features/schools/constants";
import type { AnswerKey } from "@/types/answer-key";
import { formatDate, formatDateTime } from "@/utils/format";
import {
  ANSWER_KEY_UPLOAD_PATH,
  answerKeyEditHref,
  answerKeyFileHref,
  formatFileSize,
  wasEdited,
} from "./constants";
import { DeleteAnswerKeyButton } from "./delete-answer-key-button";

const ROW_ACTION =
  "inline-flex size-8 items-center justify-center text-neutral-500 transition-colors hover:bg-brand-50 hover:text-brand-900 [&_svg]:size-4";

const NUMBER_PILL =
  "inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-brand-100 bg-brand-50 px-2 text-xs font-semibold text-brand-900 tabular-nums";

const HEAD = "h-10 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase";

export function RecentUploads({ answerKeys }: { answerKeys: AnswerKey[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgb(25_28_95/0.04),0_12px_32px_-16px_rgb(25_28_95/0.18)]">
      <header className="flex items-center justify-between gap-3 border-b border-brand-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Recent uploads</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Newest and recently edited first.</p>
        </div>
        <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 tabular-nums">
          {answerKeys.length} {answerKeys.length === 1 ? "file" : "files"}
        </span>
      </header>

      {answerKeys.length > 0 ? (
        <Table>
          <TableHeader className="bg-neutral-50/80">
            <TableRow className="border-brand-100 hover:bg-transparent">
              <TableHead className={cn(HEAD, "pl-6")}>Answer key</TableHead>
              <TableHead className={cn(HEAD, "hidden lg:table-cell")}>Program</TableHead>
              <TableHead className={HEAD}>Type</TableHead>
              <TableHead className={cn(HEAD, "hidden md:table-cell")}>School</TableHead>
              <TableHead className={cn(HEAD, "hidden text-center md:table-cell")}>Test</TableHead>
              <TableHead className={cn(HEAD, "hidden text-center md:table-cell")}>Class</TableHead>
              <TableHead className={cn(HEAD, "hidden sm:table-cell")}>Last updated</TableHead>
              <TableHead className={cn(HEAD, "pr-6 text-right")}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {answerKeys.map((key) => {
              const edited = wasEdited(key);
              return (
                <TableRow key={key.id} className="border-brand-100/70 hover:bg-brand-50/30">
                  <TableCell className="max-w-72 py-3.5 pl-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-950">{key.fileName}</p>
                        <p className="text-xs text-neutral-500">
                          {formatFileSize(key.fileSize)}
                          <span className="lg:hidden"> · {PROGRAM_LABELS[key.program]}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-neutral-800 lg:table-cell">
                    {PROGRAM_LABELS[key.program]}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                        key.type === "CUSTOMIZED"
                          ? "bg-brand-900 text-white"
                          : "border border-brand-200 bg-white text-brand-800",
                      )}
                    >
                      {TYPE_LABELS[key.type]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-56 md:table-cell">
                    {key.school ? (
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-semibold text-white uppercase">
                          {key.school.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-950" title={key.school.name}>
                            {key.school.name}
                          </p>
                          <p className="font-mono text-[11px] text-neutral-500">{key.school.code}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-500">All regular schools</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-center md:table-cell">
                    <span className={NUMBER_PILL}>{key.testNumber}</span>
                  </TableCell>
                  <TableCell className="hidden text-center md:table-cell">
                    <span className={NUMBER_PILL}>{key.classLevel}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm whitespace-nowrap text-neutral-800">{formatDateTime(key.updatedAt)}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      {edited ? (
                        <>
                          <span className="rounded-full bg-brand-50 px-1.5 py-px text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                            Edited
                          </span>
                          Uploaded {formatDate(key.createdAt)}
                        </>
                      ) : (
                        "Uploaded"
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="ml-auto flex w-fit divide-x divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                      <a
                        href={answerKeyFileHref(key.id)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open PDF"
                        aria-label={`Open ${key.fileName}`}
                        className={ROW_ACTION}
                      >
                        <ExternalLink />
                      </a>
                      <Link
                        href={answerKeyEditHref(key.id)}
                        title="Edit"
                        aria-label={`Edit ${key.fileName}`}
                        className={ROW_ACTION}
                      >
                        <Pencil />
                      </Link>
                      <DeleteAnswerKeyButton id={key.id} fileName={key.fileName} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No answer keys yet</EmptyTitle>
            <EmptyDescription>Uploaded answer keys will appear here with their date.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={ANSWER_KEY_UPLOAD_PATH} className={buttonVariants({ size: "sm" })}>
              <Upload />
              Upload answer key
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </section>
  );
}
