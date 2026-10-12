import { BrandBars } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { pillars } from "./content";

export function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Who we are"
            title={
              <>
                Innovation meets expertise to produce{" "}
                <span className="text-gradient-dark">impactful solutions</span>
              </>
            }
            description="We are an educational content and curriculum development company. Our subject experts, instructional designers, writers and artists create learning material that is accurate, engaging and built to last."
          />

          <div className="mt-12 space-y-4">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 100}>
                <div className="group flex gap-5 rounded-2xl border border-transparent p-5 transition-all hover:border-brand-100 hover:bg-brand-50/60">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white shadow-lg shadow-brand-800/20 transition-transform group-hover:scale-105">
                    <pillar.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900">
                      {pillar.title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="relative">
          <div className="bg-grid-light relative aspect-4/5 overflow-hidden rounded-[2.5rem] bg-brand-50">
            <div className="absolute inset-0 bg-linear-to-br from-brand-100/0 via-brand-100/40 to-brand-300/40" />
            <BrandBars className="absolute inset-x-[22%] top-[18%] bottom-0 text-brand-800" />
          </div>

          <div className="absolute -bottom-6 -left-4 max-w-xs rounded-2xl border border-brand-100 bg-white p-6 shadow-[0_30px_60px_-20px_rgb(25_28_95/0.35)] sm:-left-10">
            <p className="font-heading text-lg leading-snug font-semibold text-brand-900">
              &ldquo;Excellence is not just what we create. It&apos;s the impact
              we create.&rdquo;
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Our mission at Vitaran
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
