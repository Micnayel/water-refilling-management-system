import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email.").max(255),
  password: z.string().min(1, "Enter your password.").max(128),
  turnstileToken: z.string().optional(),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(160),
    email: z.string().trim().email("Enter a valid email address.").max(255),
    username: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters.")
      .max(64)
      .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dot, underscore, or hyphen."),
    password: z.string().min(10, "Use at least 10 characters.").max(128),
    confirmPassword: z.string().min(1, "Repeat your password."),
    turnstileToken: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
