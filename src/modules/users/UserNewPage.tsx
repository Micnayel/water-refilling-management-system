import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { GrantPicker } from "./GrantPicker";
import { useCreateUser, useRoles } from "./hooks";
import { createUserFormSchema, type CreateUserValues } from "./schemas";

export function UserNewPage() {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const roles = useRoles();
  const toast = useToast();
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      password: "",
      roleId: "",
      grants: [],
    },
  });

  const onRoleChange = (roleId: string) => {
    form.setValue("roleId", roleId);
    const role = roles.data?.items.find((entry) => entry.id === roleId);
    if (role) form.setValue("grants", role.grants);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await createUser.mutateAsync({
        ...values,
        roleId: values.roleId ? values.roleId : null,
      });
      toast("User created.", "success");
      navigate(`/administration/users/${user.id}/edit`);
    } catch {
      // Rendered below.
    }
  });

  return (
    <div className="space-y-3">
      <PageHeader
        title="New user"
        description="Selecting a role replaces the grants with that role's defaults; adjust them after."
        actions={
          <Button variant="outline" onClick={() => navigate("/administration/users")}>
            Back to users
          </Button>
        }
      />
      <form className="card-surface max-w-3xl space-y-3 p-3" onSubmit={onSubmit} noValidate>
        {createUser.isError ? <Alert tone="destructive">{apiMessage(createUser.error)}</Alert> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message} required>
            <Input id="fullName" autoFocus {...form.register("fullName")} />
          </Field>
          <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
            <Input id="email" type="email" {...form.register("email")} />
          </Field>
          <Field label="Username" htmlFor="username" error={form.formState.errors.username?.message} required>
            <Input id="username" autoComplete="off" {...form.register("username")} />
          </Field>
          <Field
            label="Temporary password"
            htmlFor="password"
            error={form.formState.errors.password?.message}
            hint="Hashed on the server. Share it through an approved channel."
            required
          >
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
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
              <GrantPicker value={field.value} onChange={field.onChange} idPrefix="new-user" />
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" loading={createUser.isPending}>
            Create user
          </Button>
          <Button variant="outline" onClick={() => navigate("/administration/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
