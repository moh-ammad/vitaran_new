"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHOOL_BOARDS, SCHOOL_STATUSES } from "@/types/school";
import { BOARD_LABELS, STATUS_LABELS } from "./constants";

const ALL = "ALL";
const SEARCH_DEBOUNCE_MS = 350;

const statusItems = [
  { value: ALL, label: "All statuses" },
  ...SCHOOL_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];
const boardItems = [
  { value: ALL, label: "All boards" },
  ...SCHOOL_BOARDS.map((value) => ({ value, label: BOARD_LABELS[value] })),
];

export function SchoolsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const status = searchParams.get("status") ?? ALL;
  const board = searchParams.get("board") ?? ALL;
  const hasFilters = Boolean(searchParams.get("search")) || status !== ALL || board !== ALL;

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    });
  };

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search.trim() === current) return;

    const timeout = setTimeout(() => updateParams({ search: search.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed value changes
  }, [search]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <InputGroup className="bg-white md:max-w-sm">
        <InputGroupAddon>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, city, contact or code…"
          aria-label="Search schools"
        />
      </InputGroup>

      <div className="flex gap-3">
        <Select
          items={statusItems}
          value={status}
          onValueChange={(value) => updateParams({ status: value as string })}
        >
          <SelectTrigger className="w-40 bg-white" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={boardItems}
          value={board}
          onValueChange={(value) => updateParams({ board: value as string })}
        >
          <SelectTrigger className="w-40 bg-white" aria-label="Filter by board">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {boardItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            updateParams({ search: null, status: null, board: null });
          }}
        >
          <X />
          Clear filters
        </Button>
      )}
    </div>
  );
}
