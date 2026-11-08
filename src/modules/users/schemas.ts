import { z } from "zod";

export const publicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  fullName: z.string(),
  roleId: z.string().nullable(),
  status: z.string(),
  grants: z.array(z.string()),
  template: z.string(),
  version: z.number(),
  createdAt: z.string().nullable(),
});

export const userPageSchema = z.object({
  items: z.array(publicUserSchema),
  nextCursor: z.string().nullable(),
});

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  grants: z.array(z.string()),
  isSystem: z.boolean(),
  version: z.number(),
});

export const roleListSchema = z.object({ items: z.array(roleSchema) });

export const createUserFormSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the full name.").max(160),
  email: z.string().trim().email("Enter a valid email.").max(255),
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dot, underscore, or hyphen."),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
  roleId: z.string().nullable(),
  grants: z.array(z.string()),
});

export const editUserFormSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the full name.").max(160),
  roleId: z.string().nullable(),
  grants: z.array(z.string()),
});

export const approveFormSchema = z.object({
  roleId: z.string().nullable(),
  grants: z.array(z.string()),
});

export const roleFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a role name.").max(64),
  description: z.string().trim().max(255),
  grants: z.array(z.string()),
  applyToAssigned: z.boolean(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
export type Role = z.infer<typeof roleSchema>;
export type CreateUserValues = z.infer<typeof createUserFormSchema>;
export type EditUserValues = z.infer<typeof editUserFormSchema>;
export type RoleFormValues = z.infer<typeof roleFormSchema>;
