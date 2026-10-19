"use server";

import { z } from "zod";
import { ApiError } from "@/services/api-client";
import { requestForgotPasswordOtp, verifyForgotPasswordOtp } from "@/services/auth";

export type ForgotPasswordState =
  | {
      step: "email" | "otp" | "done";
      email: string;
      message?: string;
      fieldErrors?: Partial<Record<"email" | "otp", string[]>>;
      submittedAt: number;
    }
  | undefined;

const emailSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
});

const verifySchema = z.object({
  email: z.email().trim().toLowerCase(),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: "Enter the 6-digit code from your email." }),
});

export async function requestOtpAction(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "");
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      step: "email",
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      submittedAt: Date.now(),
    };
  }

  try {
    const result = await requestForgotPasswordOtp(parsed.data.email);
    return {
      step: "otp",
      email: parsed.data.email,
      message: result.message,
      submittedAt: Date.now(),
    };
  } catch (error) {
    return {
      step: "email",
      email: parsed.data.email,
      message:
        error instanceof ApiError
          ? error.message
          : "We couldn't send a code right now. Please try again.",
      submittedAt: Date.now(),
    };
  }
}

export async function verifyOtpAction(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "");
  const otp = String(formData.get("otp") ?? "");
  const parsed = verifySchema.safeParse({ email, otp });
  if (!parsed.success) {
    return {
      step: "otp",
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      submittedAt: Date.now(),
    };
  }

  try {
    const result = await verifyForgotPasswordOtp(parsed.data.email, parsed.data.otp);
    return {
      step: "done",
      email: parsed.data.email,
      message: result.message,
      submittedAt: Date.now(),
    };
  } catch (error) {
    const fieldErrors =
      error instanceof ApiError && Array.isArray(error.details)
        ? Object.fromEntries(
            error.details
              .filter(
                (issue): issue is { path: string[]; message: string } =>
                  Array.isArray(issue?.path) && typeof issue?.message === "string",
              )
              .map((issue) => [issue.path[0], [issue.message]]),
          )
        : undefined;

    return {
      step: "otp",
      email: parsed.data.email,
      message:
        error instanceof ApiError
          ? error.message
          : "We couldn't verify that code. Please try again.",
      fieldErrors: fieldErrors as ForgotPasswordState extends { fieldErrors?: infer F } ? F : never,
      submittedAt: Date.now(),
    };
  }
}
