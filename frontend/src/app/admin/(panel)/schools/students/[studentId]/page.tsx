import { redirect } from "next/navigation";

export default function AdminStudentDetailRedirect() {
  redirect("/admin/schools/students");
}
