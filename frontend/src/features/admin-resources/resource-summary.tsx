import { BookCopy, FolderOpen, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SolutionBook } from "@/features/teachers-resources/solution-books";

export function ResourceSummary({ books }: { books: Record<string, SolutionBook[]> }) {
  const all = Object.values(books).flat();
  const stats = [
    { label: "Total files", value: all.length, icon: BookCopy },
    {
      label: "Programs with files",
      value: Object.values(books).filter((list) => list.length > 0).length,
      icon: FolderOpen,
    },
    { label: "Subjects", value: new Set(all.map((b) => b.subject)).size, icon: Layers },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-800 text-white">
              <stat.icon className="size-5" />
            </span>
            <span>
              <span className="block text-2xl font-bold text-brand-900">{stat.value}</span>
              <span className="block text-xs text-muted-foreground">{stat.label}</span>
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
