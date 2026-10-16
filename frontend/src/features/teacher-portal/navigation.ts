import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  ScanLine,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type TeacherNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type TeacherNavGroup = {
  label: string;
  items: TeacherNavItem[];
};

export const teacherNavGroups: TeacherNavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/teacher", icon: LayoutDashboard }],
  },
  {
    label: "Teaching",
    items: [
      { title: "Resources", href: "/teacher/resources", icon: BookOpen },
      { title: "Answer Keys", href: "/teacher/answer-keys", icon: KeyRound },
      { title: "Results", href: "/teacher/results", icon: Trophy },
      { title: "OMR Scan", href: "/teacher/omr-scan", icon: ScanLine },
    ],
  },
];

const allItems = teacherNavGroups.flatMap((group) => group.items);

export function isTeacherNavActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  if (href === "/teacher") return false;

  const longerMatch = allItems.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(href) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  return !longerMatch && pathname.startsWith(`${href}/`);
}

const SEGMENT_LABELS: Record<string, string> = {
  resources: "Resources",
  "answer-keys": "Answer Keys",
  results: "Results",
  "omr-scan": "OMR Scan",
};

export type TeacherBreadcrumb = { label: string; href: string };

export function getTeacherBreadcrumbs(pathname: string): TeacherBreadcrumb[] {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs: TeacherBreadcrumb[] = [{ label: "Dashboard", href: "/teacher" }];

  segments.forEach((segment, index) => {
    crumbs.push({
      label: SEGMENT_LABELS[segment] ?? "Details",
      href: `/teacher/${segments.slice(0, index + 1).join("/")}`,
    });
  });

  return crumbs;
}

export function getTeacherParentHref(pathname: string): string | null {
  return getTeacherBreadcrumbs(pathname).at(-2)?.href ?? null;
}
