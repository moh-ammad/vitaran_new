import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vitaran Learning — Educational content & curriculum development",
    template: "%s · Vitaran Learning",
  },
  description:
    "Curriculum and course development, e-learning content, instructional design, assessment, and art & production for K-12, corporates and industries.",
  icons: { icon: "/brand/vitaran-logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="font-sans antialiased">
      <body>{children}</body>
    </html>
  );
}
