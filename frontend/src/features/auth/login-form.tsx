"use client";

import { useActionState, useId } from "react";
import Form from "next/form";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { LoginFormState } from "./schema";

const INPUT_CLASSES = "h-11 rounded-xl px-3.5";

type LoginFormProps = {
  action: (state: LoginFormState, formData: FormData) => Promise<LoginFormState>;
  title: string;
  description?: string;
  identifier: {
    label: string;
    type: "email" | "text";
    placeholder: string;
  };
};

export function LoginForm({ action, title, description, identifier }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const id = useId();
  const identifierId = `${id}-identifier`;
  const passwordId = `${id}-password`;
  const identifierError = state?.fieldErrors?.identifier?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <Card className="gap-6 rounded-3xl py-7 shadow-2xl ring-0 [--card-spacing:--spacing(7)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-neutral-950">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent>
        <Form key={state?.submittedAt ?? "login"} action={formAction} noValidate>

          <FieldGroup>
            {state?.message && (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
                <AlertCircle />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={identifierError ? true : undefined}>
              <FieldLabel htmlFor={identifierId}>{identifier.label}</FieldLabel>
              <Input
                id={identifierId}
                name="identifier"
                type={identifier.type}
                required
                autoComplete="username"
                autoFocus
                placeholder={identifier.placeholder}
                defaultValue={state?.identifier ?? ""}
                aria-invalid={identifierError ? true : undefined}
                className={INPUT_CLASSES}
              />
              <FieldError>{identifierError}</FieldError>
            </Field>

            <Field data-invalid={passwordError ? true : undefined}>
              <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
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
        </Form>
      </CardContent>
    </Card>
  );
}
