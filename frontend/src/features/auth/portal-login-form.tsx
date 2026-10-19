"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ForgotPasswordForm } from "./forgot-password-form";
import { portalLogin } from "./portal-login";
import type { LoginFormState } from "./schema";

const INPUT_CLASSES = "h-11 rounded-xl px-3.5";

export function PortalLoginForm() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(
    portalLogin,
    undefined,
  );
  const id = useId();
  const identifierId = `${id}-identifier`;
  const passwordId = `${id}-password`;
  const identifierError = state?.fieldErrors?.identifier?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  if (mode === "forgot") {
    return <ForgotPasswordForm onBackToLogin={() => setMode("login")} />;
  }

  return (
    <Card className="gap-6 rounded-3xl py-7 shadow-2xl ring-0 [--card-spacing:--spacing(7)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-neutral-950">Portal sign in</CardTitle>
        <CardDescription>
          Sign in with your school or teacher email (or phone) and password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form key={state?.submittedAt ?? "login"} action={formAction} noValidate>
          <FieldGroup>
            {state?.message && (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
                <AlertCircle />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={identifierError ? true : undefined}>
              <FieldLabel htmlFor={identifierId}>Email or phone number</FieldLabel>
              <Input
                id={identifierId}
                name="identifier"
                type="text"
                required
                autoComplete="username"
                autoFocus
                placeholder="you@example.com"
                defaultValue={state?.identifier ?? ""}
                aria-invalid={identifierError ? true : undefined}
                className={INPUT_CLASSES}
              />
              <FieldError>{identifierError}</FieldError>
            </Field>

            <Field data-invalid={passwordError ? true : undefined}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                <button
                  type="button"
                  className="text-xs font-medium text-brand-800 hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id={passwordId}
                name="password"
                type="text"
                required
                autoComplete="current-password"
                spellCheck={false}
                placeholder="Enter your password"
                aria-invalid={passwordError ? true : undefined}
                className={INPUT_CLASSES}
              />
              <FieldError>{passwordError}</FieldError>
            </Field>

            <Button type="submit" disabled={pending} className="group h-11 w-full rounded-full text-sm font-semibold">
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
