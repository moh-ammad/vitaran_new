import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { processSteps } from "./content";

export function Process() {
  return (
    <section id="process" className="relative bg-brand-50 py-24 sm:py-32">
      <div className="bg-grid-light absolute inset-0 mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How we work"
          title="A proven process from idea to impact"
          description="Cross-disciplinary collaboration at every step keeps risk low and quality high."
        />

        <div className="relative mt-20">
          <div
            aria-hidden
            className="absolute top-7 right-[12%] left-[12%] hidden h-px bg-linear-to-r from-brand-800 via-brand-400 to-brand-200 lg:block"
          />
          <ol className="relative grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {processSteps.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 120} className="text-center">
                  <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-xl shadow-brand-800/25 ring-8 ring-brand-50">
                    <step.icon className="size-6" />
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-800 shadow">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-brand-900">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
