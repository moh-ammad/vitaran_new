import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { SchoolForm } from "@/features/schools/school-form";

export const metadata: Metadata = { title: "Register School" };

export default function RegisterSchoolPage() {
  return (
    <div>
      <PageHeader title="Register school" />
      <SchoolForm />
    </div>
  );
}
