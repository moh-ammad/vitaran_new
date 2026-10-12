import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { BrandBars } from "@/components/shared/logo";
import { contactDetails, offices } from "@/features/contact/content";

export function Contact() {
  return (
    <section id="contact" className="px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-950 text-white">
        <div className="bg-grid absolute inset-0 mask-[radial-gradient(ellipse_at_left,black,transparent_70%)]" />
        <div className="absolute -top-32 -left-32 size-120 rounded-full bg-brand-700/50 blur-[120px]" />
        <BrandBars className="pointer-events-none absolute right-10 bottom-0 hidden h-56 w-44 text-white/10 lg:flex" />

        <div className="relative grid gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-brand-300 uppercase">
              Contact us
            </p>
            <h2 className="mt-4 text-3xl font-bold text-balance sm:text-5xl">
              Get in touch with our team.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-brand-200/85">
              Partner with us for curriculum, content and assessment solutions
              for your school, institution or organisation.
            </p>
            <Link
              href="/contact"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-900 transition-all hover:bg-brand-100 active:scale-95"
            >
              Contact us
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <ul className="space-y-5 lg:pt-8">
            {offices.map((office) => (
              <li key={office.label} className="flex gap-4">
                <MapPin className="mt-1 size-5 shrink-0 text-glow" />
                <div>
                  <p className="font-semibold">{office.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-200/85">
                    {office.address}
                  </p>
                </div>
              </li>
            ))}
            <li className="flex gap-4">
              <Mail className="mt-0.5 size-5 shrink-0 text-glow" />
              <a
                href={`mailto:${contactDetails.email}`}
                className="text-brand-100 hover:text-white"
              >
                {contactDetails.email}
              </a>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-0.5 size-5 shrink-0 text-glow" />
              <a
                href={contactDetails.phoneHref}
                className="text-brand-100 hover:text-white"
              >
                {contactDetails.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
