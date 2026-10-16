import { cookies } from "next/headers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TEACHER_SESSION_COOKIE } from "@/constants/auth";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Cookie presence is enough for the header; protected pages verify the token itself.
  const signedIn = (await cookies()).has(TEACHER_SESSION_COOKIE);

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
