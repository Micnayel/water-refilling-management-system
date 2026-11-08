import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { useSessionStore } from "@/stores/session-store";
import { GrantPicker } from "./GrantPicker";
import { useRoles, useUpdateUser, useUser } from "./hooks";
import { editUserFormSchema, type EditUserValues } from "./schemas";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useUser(id);
  const roles = useRoles();
  const updateUser = useUpdateUser(id ?? "");
  const toast = useToast();
  const currentUser = useSessionStore((state) => state.user);

  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: { fullName: "", roleId: "", grants: [] },
  });

  useEffect(() => {
    if (query.data) {
      form.reset({
        fullName: query.data.fullName,
        roleId: query.data.roleId ?? "",
        grants: query.data.grants,
      });
    }
  }, [query.data, form]);

  if (query.isLoading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={5} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState description={apiMessage(query.error)} />;
  }

  const isSelf = currentUser?.id === query.data.id;

  const onRoleChange = (roleId: string) => {
    form.setValue("roleId", roleId);
    const role = roles.data?.items.find((entry) => entry.id === roleId);
    if (role) form.setValue("grants", role.grants);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateUser.mutateAsync({
        ...values,
        roleId: values.roleId ? values.roleId : null,
        version: query.data?.version ?? 1,
      });
      toast("User updated.", "success");
      navigate("/administration/users");
    } catch {
      // Rendered below.
    }
  });

  return (
    <div className="space-y-3">
      <PageHeader
        title={`Edit ${query.data.fullName}`}
        description={`${query.data.username} · ${query.data.status}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/administration/users")}>
            Back to users
          </Button>
        }
      />
      <form className="card-surface max-w-3xl space-y-3 p-3" onSubmit={onSubmit} noValidate>
        {updateUser.isError ? <Alert tone="destructive">{apiMessage(updateUser.error)}</Alert> : null}
        {isSelf ? (
          <Alert tone="warning">
            You cannot raise your own grants or deactivate your own account. Ask another administrator.
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message} required>
            <Input id="fullName" autoFocus {...form.register("fullName")} />
          </Field>
          <Field label="Role" htmlFor="roleId" error={form.formState.errors.roleId?.message}>
            <NativeSelect
              id="roleId"
              value={form.watch("roleId") ?? ""}
              onChange={(event) => onRoleChange(event.target.value)}
            >
              <option value="">No role</option>
              {roles.data?.items.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Grants</p>
          <Controller
            control={form.control}
            name="grants"
            render={({ field }) => (
              <GrantPicker
                value={field.value}
                onChange={field.onChange}
                disabled={isSelf}
                idPrefix="edit-user"
              />
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" loading={updateUser.isPending}>
            Save changes
          </Button>
          <Button variant="outline" onClick={() => navigate("/administration/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
