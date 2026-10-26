"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { programLabel } from "@/features/schools/constants";
import type { LearningProgram } from "@/types/program";
import { ANSWER_KEYS_PATH } from "./constants";
import { DRIVE_TESTS, type DrivePath, type DriveSchool } from "./drive-path";

const ALL = "ALL";

type AnswerKeysFiltersProps = {
  path: DrivePath;
  programs: LearningProgram[];
  schools: DriveSchool[];
};

function hrefFor(path: DrivePath) {
  const params = new URLSearchParams();
  if (path.program) {
    params.set("type", "REGULAR");
    params.set("program", path.program);
  }
  if (path.schoolId) {
    params.set("type", "CUSTOMIZED");
    params.set("school", path.schoolId);
  }
  if (path.testNumber) params.set("test", String(path.testNumber));
  const q = params.toString();
  return q ? `${ANSWER_KEYS_PATH}?${q}` : ANSWER_KEYS_PATH;
}

function FilterSelect({
  label,
  value,
  items,
  onChange,
  className,
  disabled,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const active = value !== ALL;
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as string)}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-9 rounded-lg border-brand-100 bg-white text-sm text-brand-600 shadow-none transition-colors hover:border-brand-200 hover:bg-brand-50/60",
          active && "border-brand-300 bg-brand-50 font-medium text-brand-900",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AnswerKeysFilters({ path, programs, schools }: AnswerKeysFiltersProps) {
  const router = useRouter();
  const customized = schools.filter((school) => school.type === "CUSTOMIZED");

  const programValue = path.program
    ? `p:${path.program}`
    : path.schoolId
      ? `s:${path.schoolId}`
      : ALL;

  const programItems = [
    { value: ALL, label: "All programs" },
    ...programs
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((program) => ({
        value: `p:${program.code}`,
        label: programLabel(program.code, program.name),
      })),
    ...customized
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((school) => ({
        value: `s:${school.id}`,
        label: school.name,
      })),
  ];

  const testItems = [
    { value: ALL, label: "All tests" },
    ...DRIVE_TESTS.map((n) => ({ value: String(n), label: `Test ${n}` })),
  ];

  const go = (next: DrivePath) => {
    router.push(hrefFor(next));
  };

  const onProgram = (value: string) => {
    if (value === ALL) {
      go({});
      return;
    }
    if (value.startsWith("p:")) {
      go({
        program: value.slice(2),
        testNumber: path.testNumber,
      });
      return;
    }
    if (value.startsWith("s:")) {
      go({
        schoolId: value.slice(2),
        testNumber: path.testNumber,
      });
    }
  };

  const onTest = (value: string) => {
    const owner = path.program
      ? { program: path.program }
      : path.schoolId
        ? { schoolId: path.schoolId }
        : {};
    if (!path.program && !path.schoolId) return;
    if (value === ALL) {
      go({ ...owner });
      return;
    }
    go({
      ...owner,
      testNumber: Number(value),
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <FilterSelect
        label="Program"
        value={programValue}
        items={programItems}
        onChange={onProgram}
        className="min-w-40 max-w-52"
      />
      <FilterSelect
        label="Test"
        value={path.testNumber ? String(path.testNumber) : ALL}
        items={testItems}
        onChange={onTest}
        disabled={!path.program && !path.schoolId}
        className="w-32"
      />
    </div>
  );
}
