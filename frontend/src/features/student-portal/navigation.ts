import { BookOpen, ChartPie, LayoutDashboard, Trophy, type LucideIcon } from "lucide-react";

export type StudentNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type StudentNavGroup = {
  label: string;
  items: StudentNavItem[];
};

export const studentNavGroups: StudentNavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/student", icon: LayoutDashboard }],
  },
  {
    label: "Learning",
    items: [
      { title: "Results", href: "/student/results", icon: Trophy },
      { title: "Analysis", href: "/student/analysis", icon: ChartPie },
      { title: "Resources", href: "/student/resources", icon: BookOpen },
    ],
  },
];

const allItems = studentNavGroups.flatMap((group) => group.items);

export function isStudentNavActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  if (href === "/student") return false;

  const longerMatch = allItems.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(href) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  return !longerMatch && pathname.startsWith(`${href}/`);
}

const SEGMENT_LABELS: Record<string, string> = {
  results: "Results",
  analysis: "Analysis",
  resources: "Resources",
  review: "Answer review",
};

export type StudentBreadcrumb = { label: string; href: string };

export function getStudentBreadcrumbs(pathname: string): StudentBreadcrumb[] {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs: StudentBreadcrumb[] = [{ label: "Dashboard", href: "/student" }];

  segments.forEach((segment, index) => {
    const previous = segments[index - 1];
    crumbs.push({
      label:
        SEGMENT_LABELS[segment] ??
        (previous === "results" && segment !== "review" ? `Test ${segment}` : "Details"),
      href: `/student/${segments.slice(0, index + 1).join("/")}`,
    });
  });

  return crumbs;
}

export function getStudentParentHref(pathname: string): string | null {
  const dashboard = "/student";
  if (pathname === dashboard) return null;
  if (allItems.some((item) => item.href === pathname)) return dashboard;
  return getStudentBreadcrumbs(pathname).at(-2)?.href ?? dashboard;
}
