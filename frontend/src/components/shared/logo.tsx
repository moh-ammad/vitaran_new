import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "color" | "white";
  className?: string;
};

export function Logo({ variant = "color", className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Vitaran Learning home"
      className={cn("inline-flex shrink-0", className)}
    >
      <Image
        src="/brand/vitaran-logo.png"
        alt="Vitaran Learning"
        width={100}
        height={39}
        priority
        className={cn(
          "h-12 w-auto",
          // The PNG has a solid white background: blend it away on dark surfaces.
          variant === "white" ? "mix-blend-screen grayscale invert" : "mix-blend-multiply",
        )}
      />
    </Link>
  );
}

export function BrandBars({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-stretch gap-[6%]", className)}>
      {[1, 0.75, 0.5].map((opacity, i) => (
        <span
          key={opacity}
          className="animate-bar-rise flex-1 origin-bottom rounded-[2px] bg-current"
          style={{ opacity, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
