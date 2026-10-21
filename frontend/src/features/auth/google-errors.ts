export function googleErrorMessage(code: unknown): string | null {
  if (typeof code !== "string" || !code) return null;

  switch (code) {
    case "google-unlinked":
      return "This Google account isn't registered on Vitaran. Use the school, teacher, or student email we issued.";
    case "google-inactive":
      return "This account is inactive.";
    case "google-student":
      return "This Google account is a student login. Use student sign in instead.";
    case "google-portal":
      return "This Google account is a school or teacher login. Use portal sign in instead.";
    case "google-ambiguous":
      return "This email is used for more than one student. Sign in with roll number and password.";
    case "Configuration":
      return "Google sign-in isn't configured yet.";
    case "AccessDenied":
      return "Google sign-in was cancelled.";
    case "google":
      return "Google sign-in didn't complete. Try again, or use your password.";
    default:
      return null;
  }
}

export function googleErrorCode(message: string, status: number): string {
  if (status === 403) return "google-inactive";
  if (status === 503) return "Configuration";
  if (/student sign in instead/i.test(message)) return "google-student";
  if (/portal sign in instead/i.test(message)) return "google-portal";
  if (/more than one student/i.test(message)) return "google-ambiguous";
  if (status === 401) return "google-unlinked";
  return "google";
}
