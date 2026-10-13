import { z } from "zod";
import { passwordField } from "@/features/auth/schema";

export const adminLoginSchema = z.object({
  identifier: z.email({ error: "Enter a valid email address." }).trim(),
  password: passwordField,
});
