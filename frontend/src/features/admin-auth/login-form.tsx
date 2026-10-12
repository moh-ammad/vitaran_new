"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { login } from "./actions";

const fieldClasses =
  "block w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-brand-900 outline-none transition placeholder:text-brand-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100 aria-invalid:border-destructive aria-invalid:ring-destructive/10";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const emailError = state?.fieldErrors?.email?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <div className="rounded-3xl bg-white p-6 text-brand-900 shadow-2xl sm:p-8">
      <h2 className="text-2xl font-bold">Admin sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the credentials issued to your admin account.
      </p>

      {state?.message && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{state.message}</p>
        </div>
      )}

      <form action={action} noValidate className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            placeholder="admin@vitaran.com"
            defaultValue={state?.email}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
            className={cn(fieldClasses, "mt-2")}
          />
          {emailError && (
            <span id="email-error" className="mt-1.5 block text-xs text-destructive">
              {emailError}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <span className="relative mt-2 block">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "password-error" : undefined}
              className={cn(fieldClasses, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-brand-500 transition hover:bg-brand-100 hover:text-brand-800"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </span>
          {passwordError && (
            <span
              id="password-error"
              className="mt-1.5 block text-xs text-destructive"
            >
              {passwordError}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
