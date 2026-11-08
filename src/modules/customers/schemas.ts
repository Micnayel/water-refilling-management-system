import { z } from "zod";

export const maskedCustomerSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  contact: z.string(),
  email: z.string(),
  address: z.string(),
  barangay: z.string(),
  latitude: z.null(),
  longitude: z.null(),
  gallonsOnHand: z.number(),
  status: z.string(),
  version: z.number(),
  createdAt: z.string().nullable(),
  masked: z.literal(true),
});

export const revealedCustomerSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  contact: z.string(),
  email: z.string(),
  address: z.string(),
  barangay: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  gallonsOnHand: z.number(),
  status: z.string(),
  version: z.number(),
  createdAt: z.string().nullable(),
  masked: z.literal(false),
});

export const customerPageSchema = z.object({
  items: z.array(maskedCustomerSchema),
  nextCursor: z.string().nullable(),
});

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer name.").max(160),
  contact: z.string().trim().max(32),
  email: z.string().trim().max(255).refine((value) => value === "" || /^[^@\s]+@[^@\s]+$/.test(value), "Enter a valid email."),
  address: z.string().trim().min(4, "Enter the delivery address.").max(500),
  barangay: z.string().trim().max(120),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type MaskedCustomer = z.infer<typeof maskedCustomerSchema>;
export type RevealedCustomer = z.infer<typeof revealedCustomerSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
