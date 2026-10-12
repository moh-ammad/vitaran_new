"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SchoolFormStep } from "./form-steps";

type SchoolFormStepperProps = {
  steps: readonly SchoolFormStep[];
  current: number;
  reachable: number;
  onSelect: (index: number) => void;
};

export function SchoolFormStepper({
  steps,
  current,
  reachable,
  onSelect,
}: SchoolFormStepperProps) {
  return (
    <nav aria-label="Form steps" className="px-4 pb-7 sm:px-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const complete = index < current;
          const active = index === current;
          const hasConnector = index < steps.length - 1;

          return (
            <li key={step.id} className={cn("flex items-center", hasConnector && "flex-1")}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={index > reachable}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.title}`}
                className="group relative z-10 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-neutral-300 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                    complete || active
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white text-neutral-500 group-enabled:group-hover:border-neutral-950 group-enabled:group-hover:text-neutral-950",
                    active && "ring-4 ring-neutral-200",
                  )}
                >
                  {complete ? <Check className="size-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "absolute top-full left-1/2 mt-2 hidden -translate-x-1/2 text-xs font-semibold whitespace-nowrap transition-colors sm:block",
                    complete || active ? "text-neutral-950" : "text-neutral-500",
                  )}
                >
                  {step.title}
                </span>
              </button>

              {hasConnector && (
                <span aria-hidden className="relative -mx-1 h-1.5 flex-1 overflow-hidden bg-neutral-200">
                  <span
                    className="absolute inset-0 origin-left bg-blue-600 transition-transform duration-1000 ease-in-out"
                    style={{ transform: `scaleX(${complete ? 1 : 0})` }}
                  />
                  {index === current - 1 && (
                    <span
                      key={current}
                      className="absolute inset-y-0 left-0 w-1/4 animate-connector-glint bg-linear-to-r from-transparent via-white/80 to-transparent"
                    />
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
