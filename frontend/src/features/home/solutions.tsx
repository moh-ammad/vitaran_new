import { Check } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";
import { audiences } from "./content";

const cardTones = [
  "bg-brand-800 text-white",
  "bg-brand-600 text-white",
  "bg-brand-100 text-brand-900",
];

export function Solutions() {
  return (
    <section id="solutions" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Who we serve"
          title="Tailored solutions for every kind of learner"
          description="Suitable for all types of learners, whether in the boardroom, on the factory floor or in the classroom."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {audiences.map((audience, i) => {
            const light = i === 2;
            return (
              <Reveal key={audience.title} delay={i * 120}>
                <article
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-8 transition-transform duration-300 hover:-translate-y-1.5 sm:p-10",
                    cardTones[i],
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute -right-6 -bottom-6 flex h-40 gap-2 opacity-15 transition-opacity group-hover:opacity-25",
                      light ? "text-brand-800" : "text-white",
                    )}
                  >
                    <span className="w-8 rounded-sm bg-current" />
                    <span className="w-8 rounded-sm bg-current opacity-75" />
                    <span className="w-8 rounded-sm bg-current opacity-50" />
                  </div>

                  <div
                    className={cn(
                      "flex size-14 items-center justify-center rounded-2xl",
                      light ? "bg-brand-800 text-white" : "bg-white/15 text-white",
                    )}
                  >
                    <audience.icon className="size-6" />
                  </div>
                  <h3 className="mt-8 text-2xl font-bold">{audience.title}</h3>
                  <p
                    className={cn(
                      "mt-3 leading-relaxed",
                      light ? "text-brand-700" : "text-white/75",
                    )}
                  >
                    {audience.description}
                  </p>
                  <ul className="relative mt-8 space-y-3">
                    {audience.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-3 text-sm font-medium"
                      >
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full",
                            light ? "bg-brand-800 text-white" : "bg-white text-brand-800",
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
