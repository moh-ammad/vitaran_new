import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function SchoolNotFound() {
  return (
    <Empty className="min-h-96 rounded-xl border bg-white">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>School not found</EmptyTitle>
        <EmptyDescription>
          This school may have been deleted, or the link is incorrect.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/admin/schools" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft />
          Back to schools
        </Link>
      </EmptyContent>
    </Empty>
  );
}
