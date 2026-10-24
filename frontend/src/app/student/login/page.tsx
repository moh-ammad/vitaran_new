import { redirect } from "next/navigation";
import { STUDENT_LOGIN_PATH } from "@/constants/auth";

/** Legacy path — student sign-in lives under the school portal. */
export default function LegacyStudentLoginRedirect() {
  redirect(STUDENT_LOGIN_PATH);
}
