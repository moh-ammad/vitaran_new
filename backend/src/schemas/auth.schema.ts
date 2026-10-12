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
