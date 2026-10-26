import { redirect } from "next/navigation";

export default function AdminStudentEditRedirect() {
  redirect("/admin/schools/students");
}
