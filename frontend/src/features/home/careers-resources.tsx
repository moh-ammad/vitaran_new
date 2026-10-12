import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { programs } from "@/features/teachers-resources/content";

export function CareersAndResources() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <article
            id="careers"
            className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-linear-to-br from-brand-800 to-brand-950 p-10 text-white sm:p-12"
          >
            <div className="bg-grid absolute inset-0 opacity-60" />
            <div className="absolute -right-20 -bottom-20 size-72 rounded-full bg-glow/25 blur-3xl" />
            <div className="relative">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15">
                <Briefcase className="size-5" />
              </span>
              <h2 className="mt-8 text-3xl font-bold sm:text-4xl">
                Grow with us
              </h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-brand-200/85">
                We foster a culture of continuous learning and growth. Join
                subject experts, instructional designers, writers and artists shaping
                the future of learning.
              </p>
            </div>
            <Link
              href="/contact"
              className="group relative mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-100"
            >
              View open roles
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </article>
        </Reveal>

        <Reveal delay={120}>
          <article
            id="resources"
            className="flex h-full flex-col rounded-[2rem] border border-brand-100 bg-brand-50 p-10 sm:p-12"
          >
            <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
              Teachers Resources
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
              Solution books for all our programs, in one place.
            </p>
            <ul className="mt-8 space-y-3">
              {programs.slice(0, 3).map((program) => (
                <li key={program.title}>
                  <Link
                    href="/teachers-resources"
                    className="group flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-[0_12px_30px_-15px_rgb(25_28_95/0.35)]"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                      <program.icon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-brand-900">
                        {program.title}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        Solution books
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-brand-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-800" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/teachers-resources"
              className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-95"
            >
              View all programs
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
