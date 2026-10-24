"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { BrandBars } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { capitalizeWords } from "@/features/schools/schema";
import { studentLogout } from "@/features/student-auth/actions";
import { isStudentNavActive, studentNavGroups } from "@/features/student-portal/navigation";
import type { StudentAccount } from "@/types/student";

export function StudentSidebar({ student }: { student: StudentAccount }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [signingOut, startSignOut] = useTransition();
  const displayName = capitalizeWords(student.name);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const classLabel = `Class ${student.classLevel}${student.sectionName ? `-${student.sectionName}` : ""}`;

  return (
    <Sidebar side={isMobile ? "right" : "left"} collapsible="icon">
      {!isMobile && (
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/student" />}
                className="hover:bg-transparent active:bg-transparent"
              >
                <span className="flex aspect-square size-7 shrink-0 items-center justify-center rounded-md bg-white text-brand-800">
                  <BrandBars className="h-3.5 w-3.5" />
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-xs font-heading font-bold text-white">Vitaran Learning</span>
                  <span className="truncate text-[10px] text-brand-400">Student</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      )}

      <SidebarContent>
        {studentNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-brand-300 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isStudentNavActive(item.href, pathname)}
                      onClick={() => isMobile && setOpenMobile(false)}
                      render={<Link href={item.href} />}
                      className="h-9 gap-2 px-2 text-[13px] transition-colors duration-150 data-active:bg-white data-active:font-bold data-active:text-brand-900"
                    >
                      <item.icon className="!size-3.5" />
                      <span className="font-semibold tracking-tight">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-brand-700 text-xs font-semibold text-white">
                    {initials || "S"}
                  </AvatarFallback>
                </Avatar>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">{displayName}</span>
                  <span className="truncate text-xs text-brand-300">
                    {student.rollNo} · {classLabel}
                  </span>
                </span>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={8}
                className="min-w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <span className="block text-sm font-medium text-foreground">{displayName}</span>
                    <span className="block truncate text-xs">Roll {student.rollNo}</span>
                    <span className="mt-1 block truncate text-xs text-neutral-500">
                      {student.school.name} · {classLabel}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={signingOut}
                  onClick={() => startSignOut(() => studentLogout())}
                >
                  <LogOut />
                  {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
