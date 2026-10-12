import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";
import { services } from "./content";

export function Services() {
  return (
    <section
      id="services"
      className="relative overflow-hidden bg-brand-950 py-24 text-white sm:py-32"
    >
      <div className="bg-grid absolute inset-0 mask-[linear-gradient(to_bottom,black,transparent)]" />
      <div className="absolute top-1/3 -left-40 size-120 rounded-full bg-brand-700/40 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="Our services"
          title="Educational content crafted by experts"
          description="One partner for the entire journey, from the first learning objective to finished, classroom-ready content."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal
              key={service.title}
              delay={(i % 3) * 80}
              className={cn(i === 0 && "sm:col-span-2")}
            >
              <article
                className={cn(
                  "group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/4 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/8",
                  i === 0 &&
                    "bg-linear-to-br from-brand-700/60 to-white/4 sm:p-10",
                )}
              >
                <div className="absolute -top-16 -right-16 size-40 rounded-full bg-glow/0 blur-3xl transition-colors duration-500 group-hover:bg-glow/25" />
                <div className="relative flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-800">
                    <service.icon className="size-5" />
                  </div>
                  <ArrowUpRight className="size-5 text-brand-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
                <h3
                  className={cn(
                    "relative mt-8 text-lg font-semibold",
                    i === 0 && "text-2xl",
                  )}
                >
                  {service.title}
                </h3>
                <p
                  className={cn(
                    "relative mt-2 text-sm leading-relaxed text-brand-200/75",
                    i === 0 && "max-w-lg text-base",
                  )}
                >
                  {service.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
