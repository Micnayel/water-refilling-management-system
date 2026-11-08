import { apiRequest } from "@/lib/api-client";
import {
  publicUserSchema,
  roleListSchema,
  roleSchema,
  userPageSchema,
  type CreateUserValues,
  type EditUserValues,
  type PublicUser,
  type RoleFormValues,
} from "./schemas";

export function queryUsers(input: {
  cursor?: string;
  pageSize: number;
  search?: string;
  status?: "active" | "pending" | "inactive";
}): Promise<{ items: PublicUser[]; nextCursor: string | null }> {
  return apiRequest("/users/query", { method: "POST", body: input, schema: userPageSchema });
}

export function getPendingUsers() {
  return apiRequest("/users/pending", { schema: userPageSchema });
}

export function getUser(id: string): Promise<PublicUser> {
  return apiRequest(`/users/${id}`, { schema: publicUserSchema });
}

export function createUser(values: CreateUserValues): Promise<PublicUser> {
  return apiRequest("/users", { method: "POST", body: values, schema: publicUserSchema });
}

export function updateUser(
  id: string,
  values: EditUserValues & { version: number },
): Promise<PublicUser> {
  return apiRequest(`/users/${id}`, { method: "PATCH", body: values, schema: publicUserSchema });
}

export function approveUser(id: string, values: { roleId: string | null; grants: string[] }) {
  return apiRequest(`/users/${id}/approve`, { method: "POST", body: values, schema: publicUserSchema });
}

export function rejectUser(id: string) {
  return apiRequest(`/users/${id}/reject`, { method: "POST", body: {}, schema: publicUserSchema });
}

export function setUserActive(id: string, action: "deactivate" | "reactivate") {
  return apiRequest(`/users/${id}/${action}`, { method: "POST", body: {}, schema: publicUserSchema });
}

export function listRoles() {
  return apiRequest("/roles", { schema: roleListSchema });
}

export function createRole(values: RoleFormValues) {
  return apiRequest("/roles", {
    method: "POST",
    body: { name: values.name, description: values.description, grants: values.grants },
    schema: roleSchema,
  });
}

export function updateRole(id: string, values: RoleFormValues & { version: number }) {
  return apiRequest(`/roles/${id}`, {
    method: "PATCH",
    body: {
      name: values.name,
      description: values.description,
      grants: values.grants,
      applyToAssigned: values.applyToAssigned,
      version: values.version,
    },
    schema: roleSchema,
  });
}

export function deleteRole(id: string) {
  return apiRequest(`/roles/${id}`, { method: "DELETE" });
}
