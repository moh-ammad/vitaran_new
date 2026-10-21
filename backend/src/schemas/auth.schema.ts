import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(256),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** `identifier` is the school's login email or phone number. */
export const schoolLoginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(256),
});

export type SchoolLoginInput = z.infer<typeof schoolLoginSchema>;

/** Student portal: roll number or parent/guardian email + password. */
export const studentLoginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(256),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;

/** Portal reset uses login email; student reset uses roll number (looks up parent email). */
export const forgotPasswordRequestSchema = z
  .object({
    email: z.email().trim().toLowerCase().optional(),
    rollNo: z.string().trim().min(1).max(64).optional(),
  })
  .superRefine((value, ctx) => {
    const hasEmail = Boolean(value.email);
    const hasRoll = Boolean(value.rollNo);
    if (hasEmail === hasRoll) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either a login email or a student roll number.",
        path: hasRoll ? ["rollNo"] : ["email"],
      });
    }
  });

export const forgotPasswordVerifySchema = z.object({
  email: z.email().trim().toLowerCase(),
  otp: z.string().trim().min(4).max(8),
});

export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordVerifyInput = z.infer<typeof forgotPasswordVerifySchema>;

export const googleLoginSchema = z.object({
  idToken: z.string().trim().min(20).max(8192),
  portal: z.enum(["school", "student"]),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
