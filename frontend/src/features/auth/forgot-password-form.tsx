"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  requestOtpAction,
  verifyOtpAction,
  type ForgotPasswordState,
} from "./forgot-password-actions";

const INPUT_CLASSES = "h-11 rounded-xl px-3.5";

function BackLink({ onBackToLogin }: { onBackToLogin?: () => void }) {
  if (onBackToLogin) {
    return (
      <button
        type="button"
        className="inline-flex items-center justify-center gap-1 text-xs font-medium text-neutral-600 hover:underline"
        onClick={onBackToLogin}
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </button>
    );
  }
  return (
    <Link
      href="/school/login"
      className="inline-flex items-center justify-center gap-1 text-xs font-medium text-neutral-600 hover:underline"
    >
      <ArrowLeft className="size-3.5" />
      Back to sign in
    </Link>
  );
}

type ForgotPasswordFormProps = {
  onBackToLogin?: () => void;
  description?: string;
  emailLabel?: string;
};

export function ForgotPasswordForm({
  onBackToLogin,
  description = "Enter your school or teacher login email. We send a one-time code first — only after you verify it do we create and email a new password.",
  emailLabel = "Login email",
}: ForgotPasswordFormProps) {
  const [requestState, requestAction, requestPending] = useActionState<
    ForgotPasswordState,
    FormData
  >(requestOtpAction, undefined);
  const [verifyState, verifyAction, verifyPending] = useActionState<ForgotPasswordState, FormData>(
    verifyOtpAction,
    undefined,
  );

  const step =
    verifyState?.step === "done"
      ? "done"
      : verifyState?.step === "otp" || requestState?.step === "otp"
        ? "otp"
        : "email";
  const email = verifyState?.email || requestState?.email || "";
  const pending = requestPending || verifyPending;
  const otpError = verifyState?.fieldErrors?.otp?.[0];
  const emailError = requestState?.fieldErrors?.email?.[0];
  const id = useId();

  if (step === "done") {
    return (
      <Card className="gap-6 rounded-3xl py-7 shadow-2xl ring-0 [--card-spacing:--spacing(7)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neutral-950">Password updated</CardTitle>
          <CardDescription>
            Your new password was emailed to{" "}
            <span className="font-medium text-neutral-800">{email}</span>. The updated password also
            appears on the admin/school detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertDescription>{verifyState?.message}</AlertDescription>
          </Alert>
          {onBackToLogin ? (
            <Button type="button" className="h-11 w-full rounded-full" onClick={onBackToLogin}>
              Back to sign in
            </Button>
          ) : (
            <Link
              href="/school/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
            >
              Back to sign in
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "otp") {
    const infoMessage = requestState?.step === "otp" ? requestState.message : undefined;
    const errorMessage = verifyState?.step === "otp" ? verifyState.message : undefined;

    return (
      <Card className="gap-6 rounded-3xl py-7 shadow-2xl ring-0 [--card-spacing:--spacing(7)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neutral-950">Enter verification code</CardTitle>
          <CardDescription>
            We sent a 6-digit OTP to <span className="font-medium text-neutral-800">{email}</span>.
            After you verify it, a new password is emailed automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            key={`otp-${verifyState?.submittedAt ?? requestState?.submittedAt ?? "x"}`}
            action={verifyAction}
            noValidate
          >
            <input type="hidden" name="email" value={email} />
            <FieldGroup>
              {infoMessage && !errorMessage ? (
                <Alert className="rounded-xl border-brand-200 bg-brand-50 text-brand-950">
                  <AlertCircle />
                  <AlertDescription>{infoMessage}</AlertDescription>
                </Alert>
              ) : null}
              {errorMessage ? (
                <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
                  <AlertCircle />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={otpError ? true : undefined}>
                <FieldLabel htmlFor={`${id}-otp`}>One-time code</FieldLabel>
                <Input
                  id={`${id}-otp`}
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="6-digit code"
                  aria-invalid={otpError ? true : undefined}
                  className={`${INPUT_CLASSES} font-mono tracking-[0.35em]`}
                />
                <FieldError>{otpError}</FieldError>
              </Field>

              <Button type="submit" disabled={pending} className="h-11 w-full rounded-full text-sm font-semibold">
                {verifyPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify &amp; get new password
                    <ArrowRight />
                  </>
                )}
              </Button>
            </FieldGroup>
          </form>

          <form action={requestAction} className="flex items-center justify-between gap-2">
            <input type="hidden" name="email" value={email} />
            <BackLink onBackToLogin={onBackToLogin} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending} className="text-xs">
              {requestPending ? <Loader2 className="animate-spin" /> : null}
              Resend code
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-6 rounded-3xl py-7 shadow-2xl ring-0 [--card-spacing:--spacing(7)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-neutral-950">Forgot password</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form key={requestState?.submittedAt ?? "email"} action={requestAction} noValidate>
          <FieldGroup>
            {requestState?.step === "email" && requestState.message ? (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
                <AlertCircle />
                <AlertDescription>{requestState.message}</AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={emailError ? true : undefined}>
              <FieldLabel htmlFor={`${id}-email`}>{emailLabel}</FieldLabel>
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                defaultValue={email}
                aria-invalid={emailError ? true : undefined}
                className={INPUT_CLASSES}
              />
              <FieldError>{emailError}</FieldError>
            </Field>

            <Button type="submit" disabled={pending} className="h-11 w-full rounded-full text-sm font-semibold">
              {requestPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending code…
                </>
              ) : (
                <>
                  Send verification code
                  <ArrowRight />
                </>
              )}
            </Button>

            <BackLink onBackToLogin={onBackToLogin} />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
