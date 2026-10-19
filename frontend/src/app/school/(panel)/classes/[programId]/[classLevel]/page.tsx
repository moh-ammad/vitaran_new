import { redirect } from "next/navigation";

/** Legacy class-teacher route — sections are managed on /school/classes. */
export default async function LegacySchoolClassDetailPage() {
  redirect("/school/classes");
}
