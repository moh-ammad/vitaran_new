import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(1, { error: "Enter your password." }),
});

export type LoginFormState =
  | {
      email?: string;
      fieldErrors?: { email?: string[]; password?: string[] };
      message?: string;
    }
  | undefined;
