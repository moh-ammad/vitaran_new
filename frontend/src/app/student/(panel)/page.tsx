import { redirect } from "next/navigation";
import { STUDENT_HOME_PATH } from "@/constants/auth";

export default function StudentHomePage() {
  redirect(STUDENT_HOME_PATH);
}
