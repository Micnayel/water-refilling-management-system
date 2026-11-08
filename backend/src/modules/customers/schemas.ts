import { z } from "zod";

export const queryCustomersSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(160).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

const coordinate = {
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
};

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  contact: z.string().trim().max(32).optional().default(""),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address: z.string().trim().min(4).max(500),
  barangay: z.string().trim().max(120).optional().default(""),
  ...coordinate,
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  version: z.number().int().min(1),
});

export const geocodeSchema = z.object({
  address: z.string().trim().min(4).max(500),
});

export type QueryCustomersInput = z.infer<typeof queryCustomersSchema>;
