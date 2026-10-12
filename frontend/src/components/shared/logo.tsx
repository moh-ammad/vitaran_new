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
        width={407}
        height={150}
        priority
        className={cn(
          "h-10 w-auto",
          variant === "white" && "brightness-0 invert",
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
