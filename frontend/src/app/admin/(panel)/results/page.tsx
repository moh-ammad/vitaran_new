import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/features/admin/page-header";

export const metadata: Metadata = { title: "Results" };

export default function AdminResultsPage() {
  return (
    <>
      <PageHeader title="Results" description="Publish and manage exam results." />
      <Card>
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Coming soon</EmptyTitle>
            <EmptyDescription>
              Results management will be available here shortly.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    </>
  );
}
