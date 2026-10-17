"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { schoolLogin } from "@/features/school-auth/actions";
import { teacherLogin } from "@/features/teacher-auth/actions";
import type { LoginFormState } from "./schema";

const INPUT_CLASSES = "h-11 rounded-xl px-3.5";

const ROLE_ITEMS = [
  { value: "school", label: "School" },
  { value: "teacher", label: "Teacher" },
] as const;

type PortalRole = (typeof ROLE_ITEMS)[number]["value"];

type PortalLoginFormProps = {
  defaultRole?: PortalRole;
};

export function PortalLoginForm({ defaultRole = "school" }: PortalLoginFormProps) {
  const [role, setRole] = useState<PortalRole>(defaultRole);
  const action = role === "teacher" ? teacherLogin : schoolLogin;
  const [state, formAction, pending] = useActionState<LoginFormState, FormData>(action, undefined);
  const id = useId();
  const identifierId = `${id}-identifier`;
  const passwordId = `${id}-password`;
  const identifierError = state?.fieldErrors?.identifier?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <Card className="gap-6 rounded-3xl py-7 shadow-2xl ring-0 [--card-spacing:--spacing(7)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-neutral-950">Portal sign in</CardTitle>
        <CardDescription>Choose school or teacher, then sign in with your email or phone.</CardDescription>
      </CardHeader>

      <CardContent>
        <form key={`${role}-${state?.submittedAt ?? "login"}`} action={formAction} noValidate>
          <FieldGroup>
            {state?.message && (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
                <AlertCircle />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor={`${id}-role`}>I am a</FieldLabel>
              <Select
                items={[...ROLE_ITEMS]}
                value={role}
                onValueChange={(value) => {
                  if (value === "school" || value === "teacher") setRole(value);
                }}
              >
                <SelectTrigger id={`${id}-role`} className={`w-full ${INPUT_CLASSES}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={identifierError ? true : undefined}>
              <FieldLabel htmlFor={identifierId}>Email or phone number</FieldLabel>
              <Input
                id={identifierId}
                name="identifier"
                type="text"
                required
                autoComplete="username"
                autoFocus
                placeholder={
                  role === "teacher" ? "teacher@example.com" : "school@example.com"
                }
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
        </form>
      </CardContent>
    </Card>
  );
}
