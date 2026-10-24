import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from "lucide-react";
import { LearningMap } from "./learning-map";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 pt-32 pb-24 text-white sm:pt-40 lg:pb-32">
      <div className="bg-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 size-200 -translate-x-1/2 rounded-full bg-brand-700/40 blur-[140px]" />
      <div className="absolute right-0 bottom-0 -z-10 size-120 rounded-full bg-glow/20 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="animate-in fade-in slide-in-from-bottom-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-brand-200 backdrop-blur duration-700">
            <Sparkles className="size-3.5 text-glow" />
            Fostering a culture of continuous learning
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-6 mt-8 text-4xl leading-[1.05] font-extrabold text-balance duration-700 sm:text-6xl lg:text-7xl">
            Transforming the way of{" "}
            <span className="text-gradient">learning</span> through expert-led
            innovation.
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-8 mt-7 max-w-xl text-lg leading-relaxed text-brand-200/85 duration-1000">
            From curriculum and course development to instructional design,
            assessment and art production, we create educational content for{" "}
            <span className="whitespace-nowrap">K-12</span>, corporates and
            industries that learners genuinely enjoy.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-8 mt-10 flex flex-col gap-3 duration-1000 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-900 shadow-[0_10px_40px_-10px_rgb(143_149_255/0.7)] transition-all hover:bg-brand-100"
            >
              Contact us
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/#services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <PlayCircle className="size-4" />
              Explore services
            </Link>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-300">
            {["Corporates", "Industries", "K-12"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-glow" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <LearningMap />
      </div>
    </section>
  );
}
