import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { SchoolForm } from "@/features/schools/school-form";

export const metadata: Metadata = { title: "Register School" };

export default function RegisterSchoolPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Register school"
        description="Add a new partner school. Fields marked * are required."
      />
      <SchoolForm />
    </div>
  );
}
