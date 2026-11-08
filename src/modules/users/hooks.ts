import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateUserValues, EditUserValues, RoleFormValues } from "./schemas";
import * as service from "./service";

export const userKeys = {
  list: ["users", "list"] as const,
  pending: ["users", "pending"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  roles: ["roles"] as const,
};

export function useUserList(
  page: number,
  pageSize: number,
  search: string,
  status: "" | "active" | "pending" | "inactive",
) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  return useQuery({
    queryKey: [...userKeys.list, cursor ?? "start", pageSize, search, status],
    queryFn: () =>
      service.queryUsers({
        cursor,
        pageSize,
        search: search || undefined,
        status: status || undefined,
      }),
    placeholderData: (previous) => previous,
  });
}

export function usePendingUsers() {
  return useQuery({ queryKey: userKeys.pending, queryFn: service.getPendingUsers });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? "none"),
    queryFn: () => service.getUser(id as string),
    enabled: Boolean(id),
  });
}

export function useRoles() {
  return useQuery({ queryKey: userKeys.roles, queryFn: service.listRoles });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["users"] });
    void queryClient.invalidateQueries({ queryKey: ["roles"] });
  };
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (values: CreateUserValues) => service.createUser(values),
    onSuccess: invalidate,
  });
}

export function useUpdateUser(id: string) {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (values: EditUserValues & { version: number }) => service.updateUser(id, values),
    onSuccess: invalidate,
  });
}

export function useApproveUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { id: string; values: { roleId: string | null; grants: string[] } }) =>
      service.approveUser(input.id, input.values),
    onSuccess: invalidate,
  });
}

export function useRejectUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => service.rejectUser(id),
    onSuccess: invalidate,
  });
}

export function useSetUserActive() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { id: string; action: "deactivate" | "reactivate" }) =>
      service.setUserActive(input.id, input.action),
    onSuccess: invalidate,
  });
}

export function useCreateRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (values: RoleFormValues) => service.createRole(values),
    onSuccess: invalidate,
  });
}

export function useUpdateRole(id: string) {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (values: RoleFormValues & { version: number }) => service.updateRole(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => service.deleteRole(id),
    onSuccess: invalidate,
  });
}
