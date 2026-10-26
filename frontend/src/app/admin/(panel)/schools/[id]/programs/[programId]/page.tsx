import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminSchoolProgramRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/schools/students?schoolId=${encodeURIComponent(id)}`);
}
