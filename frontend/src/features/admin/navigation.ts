import {
  CirclePlus,
  KeyRound,
  LayoutDashboard,
  School,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Schools",
    items: [
      { title: "Register School", href: "/admin/schools/new", icon: CirclePlus },
      { title: "Schools", href: "/admin/schools", icon: School },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Answer Keys", href: "/admin/answer-keys", icon: KeyRound },
      { title: "Results", href: "/admin/results", icon: Trophy },
    ],
  },
];

const allItems = adminNavGroups.flatMap((group) => group.items);

export function isNavItemActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return false;

  const longerMatch = allItems.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(href) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  return !longerMatch && pathname.startsWith(`${href}/`);
}

const SEGMENT_LABELS: Record<string, string> = {
  schools: "Schools",
  new: "Register",
  edit: "Edit",
  "answer-keys": "Answer Keys",
  results: "Results",
};

export type AdminBreadcrumb = { label: string; href: string };

export function getAdminBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs: AdminBreadcrumb[] = [{ label: "Dashboard", href: "/admin" }];

  segments.forEach((segment, index) => {
    crumbs.push({
      label: SEGMENT_LABELS[segment] ?? "Details",
      href: `/admin/${segments.slice(0, index + 1).join("/")}`,
    });
  });

  return crumbs;
}

export function getAdminParentHref(pathname: string): string | null {
  return getAdminBreadcrumbs(pathname).at(-2)?.href ?? null;
}
