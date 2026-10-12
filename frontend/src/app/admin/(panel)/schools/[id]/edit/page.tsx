import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { SchoolForm } from "@/features/schools/school-form";
import { getSchool } from "@/services/schools";

export const metadata: Metadata = { title: "Edit School" };

export default async function EditSchoolPage({ params }: PageProps<"/admin/schools/[id]/edit">) {
  const { id } = await params;
  const school = await getSchool(id);
  if (!school) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit ${school.name}`}
        description={`School code ${school.code}`}
      />
      <SchoolForm school={school} />
    </div>
  );
}
