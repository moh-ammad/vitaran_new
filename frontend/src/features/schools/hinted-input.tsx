"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";

type HintedInputProps = ComponentProps<typeof Input> & {
  /** Returns the format hint for an invalid value, or null when the value is fine. */
  getHint: (value: string) => string | null;
  sanitize?: (value: string) => string;
  /** Shown instead of the hint once the field loses focus. */
  error?: ReactNode;
};

/** Shows a live format hint only while the field is focused. */
export function HintedInput({
  id,
  getHint,
  sanitize,
  error,
  onFocus,
  onInput,
  onBlur,
  ...props
}: HintedInputProps) {
  const [hint, setHint] = useState<string | null>(null);
  const hintId = `${id}-hint`;

  const check = (input: HTMLInputElement) => {
    if (sanitize) {
      const clean = sanitize(input.value);
      if (clean !== input.value) input.value = clean;
    }
    setHint(getHint(input.value));
  };

  return (
    <>
      <Input
        {...props}
        id={id}
        aria-describedby={hint ? hintId : undefined}
        onFocus={(event) => {
          check(event.currentTarget);
          onFocus?.(event);
        }}
        onInput={(event) => {
          check(event.currentTarget);
          onInput?.(event);
        }}
        onBlur={(event) => {
          setHint(null);
          onBlur?.(event);
        }}
      />
      {hint ? (
        <p id={hintId} aria-live="polite" className="text-xs font-medium text-blue-600">
          {hint}
        </p>
      ) : (
        error
      )}
    </>
  );
}
