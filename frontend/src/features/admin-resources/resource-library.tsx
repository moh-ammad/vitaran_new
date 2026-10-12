"use client";

import { useMemo, useState } from "react";
import {
  Atom,
  Calculator,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  Leaf,
  Microscope,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { programs } from "@/features/teachers-resources/content";
import type { SolutionBook, Subject } from "@/features/teachers-resources/solution-books";

const ALL = "ALL";

const subjectIcons: Record<Subject, LucideIcon> = {
  Mathematics: Calculator,
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Leaf,
  Science: Microscope,
};

type ResourceLibraryProps = {
  books: Record<string, SolutionBook[]>;
  label: string;
};

function sortBooks(books: SolutionBook[]) {
  return [...books].sort(
    (a, b) =>
      a.subject.localeCompare(b.subject) ||
      a.grade - b.grade ||
      (a.volume ?? 0) - (b.volume ?? 0),
  );
}

function ProgramResources({ books, label }: { books: SolutionBook[]; label: string }) {
  const [subject, setSubject] = useState(ALL);
  const [grade, setGrade] = useState(ALL);

  const subjectItems = useMemo(
    () => [
      { value: ALL, label: "All subjects" },
      ...[...new Set(books.map((b) => b.subject))].sort().map((s) => ({ value: s, label: s })),
    ],
    [books],
  );
  const gradeItems = useMemo(
    () => [
      { value: ALL, label: "All classes" },
      ...[...new Set(books.map((b) => b.grade))]
        .sort((a, b) => a - b)
        .map((g) => ({ value: String(g), label: `Class ${g}` })),
    ],
    [books],
  );

  const visible = useMemo(
    () =>
      sortBooks(
        books.filter(
          (book) =>
            (subject === ALL || book.subject === subject) &&
            (grade === ALL || String(book.grade) === grade),
        ),
      ),
    [books, subject, grade],
  );

  if (books.length === 0) {
    return (
      <Card>
        <Empty className="py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No {label.toLowerCase()} yet</EmptyTitle>
            <EmptyDescription>
              Files for this program haven&apos;t been published.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Select items={subjectItems} value={subject} onValueChange={(v) => setSubject(v as string)}>
            <SelectTrigger className="w-40" aria-label="Filter by subject">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjectItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select items={gradeItems} value={grade} onValueChange={(v) => setGrade(v as string)}>
            <SelectTrigger className="w-36" aria-label="Filter by class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gradeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {visible.length} of {books.length} files
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Subject</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead className="hidden md:table-cell">File</TableHead>
            <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((book) => {
            const Icon = subjectIcons[book.subject];
            const fileName = book.href.split("/").pop();
            return (
              <TableRow key={book.href}>
                <TableCell className="pl-4">
                  <span className="flex items-center gap-2.5 font-medium text-brand-900">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon className="size-4" />
                    </span>
                    {book.subject}
                  </span>
                </TableCell>
                <TableCell>Class {book.grade}</TableCell>
                <TableCell>
                  {book.volume ? (
                    <Badge variant="secondary">Volume {book.volume}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                  {book.external ? "External link" : fileName}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <a
                            href={book.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${book.subject} class ${book.grade}`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          />
                        }
                      >
                        <ExternalLink />
                      </TooltipTrigger>
                      <TooltipContent>Open</TooltipContent>
                    </Tooltip>
                    {!book.external && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <a
                              href={book.href}
                              download
                              aria-label={`Download ${book.subject} class ${book.grade}`}
                              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            />
                          }
                        >
                          <Download />
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ResourceLibrary({ books, label }: ResourceLibraryProps) {
  return (
    <Tabs defaultValue={programs[0]?.title}>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList className="h-auto bg-white p-1 ring-1 ring-foreground/10">
          {programs.map((program) => (
            <TabsTrigger
              key={program.title}
              value={program.title}
              className="h-8 px-3 data-active:bg-brand-800 data-active:text-white"
            >
              <program.icon />
              {program.title}
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {books[program.title]?.length ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {programs.map((program) => (
        <TabsContent key={program.title} value={program.title} className="mt-4">
          <ProgramResources books={books[program.title] ?? []} label={label} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
