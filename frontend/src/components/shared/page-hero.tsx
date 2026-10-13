import type { ReactNode } from "react";

type PageHeroProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Extra content under the subtitle, e.g. stats or actions. */
  children?: ReactNode;
};

/** Dark brand banner at the top of inner site pages. */
export function PageHero({ title, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 pt-28 pb-12 text-white sm:pt-32 sm:pb-14">
      <div className="bg-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 size-160 -translate-x-1/2 rounded-full bg-brand-700/40 blur-[140px]" />

      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-brand-200/85 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
