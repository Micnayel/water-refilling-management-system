import { z } from "zod";

export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  fullName: z.string(),
  roleId: z.string().nullable(),
  status: z.string(),
  grants: z.array(z.string()),
  template: z.string(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
  csrfToken: z.string(),
});

export const loginResponseSchema = z.object({
  user: sessionUserSchema,
  csrfToken: z.string(),
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
