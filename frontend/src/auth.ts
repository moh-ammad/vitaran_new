import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js is only the Google handshake.
 * Portal sessions stay the existing school / teacher / student JWT cookies.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : [],
  session: { strategy: "jwt", maxAge: 60 * 5 },
  pages: {
    signIn: "/school/login",
    error: "/auth/google/error",
  },
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider === "google" && account.id_token) {
        token.idToken = account.id_token;
      }
      return token;
    },
    session({ session, token }) {
      session.idToken = typeof token.idToken === "string" ? token.idToken : undefined;
      return session;
    },
  },
});
