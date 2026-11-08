import { z } from "zod";
import { ALL_GRANTS } from "../../lib/grants";

const grantSchema = z.enum(ALL_GRANTS);

export const queryUsersSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(160).optional(),
  status: z.enum(["active", "pending", "inactive"]).optional(),
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  username: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(10).max(128),
  roleId: z.string().uuid().nullable().optional(),
  grants: z.array(grantSchema).max(ALL_GRANTS.length).optional(),
  status: z.enum(["active", "pending", "inactive"]).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  roleId: z.string().uuid().nullable().optional(),
  grants: z.array(grantSchema).max(ALL_GRANTS.length).optional(),
  status: z.enum(["active", "pending", "inactive"]).optional(),
  template: z.string().trim().max(64).optional(),
  version: z.number().int().min(1),
});

export const approveUserSchema = z.object({
  roleId: z.string().uuid().nullable().optional(),
  grants: z.array(grantSchema).max(ALL_GRANTS.length).optional(),
});

export const roleSchema = z.object({
  name: z.string().trim().min(2).max(64),
  description: z.string().trim().max(255).optional(),
  grants: z.array(grantSchema).max(ALL_GRANTS.length),
});

export const updateRoleSchema = roleSchema.partial().extend({
  version: z.number().int().min(1),
  applyToAssigned: z.boolean().optional(),
});
