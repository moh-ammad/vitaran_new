import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ContactDetails } from "@/features/contact/contact-details";
import { ContactForm } from "@/features/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Vitaran Learning. Offices in Hyderabad and Pune.",
};

export default function ContactPage() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 pt-32 pb-24 text-white sm:pt-40">
      <div className="bg-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 size-200 -translate-x-1/2 rounded-full bg-brand-700/40 blur-[140px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-brand-200">
            <Sparkles className="size-3.5 text-glow" />
            We&apos;d love to hear from you
          </p>
          <h1 className="mt-7 text-4xl leading-tight font-extrabold sm:text-6xl">
            Contact <span className="text-gradient">Us</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-brand-200/85">
            Partner with us for curriculum, content and assessment solutions
            for your school, institution or organisation.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <ContactDetails />
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
