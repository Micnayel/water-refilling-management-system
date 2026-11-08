import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { usePermission } from "@/hooks/use-permission";
import { GrantPicker } from "./GrantPicker";
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "./hooks";
import type { Role } from "./schemas";

interface RoleDraft {
  name: string;
  description: string;
  grants: string[];
  applyToAssigned: boolean;
}

const EMPTY_DRAFT: RoleDraft = { name: "", description: "", grants: [], applyToAssigned: false };

export function RolesPage() {
  const query = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const toast = useToast();
  const canAdd = usePermission("admin:add");
  const canEdit = usePermission("admin:edit");
  const canDelete = usePermission("admin:delete");
  const [editor, setEditor] = useState<{ mode: "create" } | { mode: "edit"; role: Role } | null>(null);
  const [draft, setDraft] = useState<RoleDraft>(EMPTY_DRAFT);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const updateRole = useUpdateRole(editor?.mode === "edit" ? editor.role.id : "");

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditor({ mode: "create" });
    setError("");
  };

  const openEdit = (role: Role) => {
    setDraft({
      name: role.name,
      description: role.description,
      grants: role.grants,
      applyToAssigned: false,
    });
    setEditor({ mode: "edit", role });
    setError("");
  };

  const save = async () => {
    if (draft.name.trim().length < 2) {
      setError("Enter a role name with at least 2 characters.");
      return;
    }
    try {
      if (editor?.mode === "edit") {
        await updateRole.mutateAsync({ ...draft, version: editor.role.version });
        toast("Role updated.", "success");
      } else {
        await createRole.mutateAsync(draft);
        toast("Role created.", "success");
      }
      setEditor(null);
    } catch (err) {
      setError(apiMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast("Role deleted.", "success");
      setDeleteTarget(null);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Roles"
        description="Roles carry default grants. Selecting a role in the user editor copies them."
        actions={
          <>
            <Link to="/administration/users" className={buttonVariants({ variant: "outline" })}>
              Users
            </Link>
            {canAdd ? <Button onClick={openCreate}>New role</Button> : null}
          </>
        }
      />

      <div className="card-surface overflow-hidden">
        {query.isLoading ? (
          <div className="p-3">
            <SkeletonRows rows={5} />
          </div>
        ) : query.isError ? (
          <ErrorState
            description={apiMessage(query.error)}
            action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
          />
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState title="No roles yet" description="Create a role to bundle default grants." />
        ) : (
          <TableWrap>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell className="text-right">Grants</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.items.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">{role.description || "—"}</TableCell>
                    <TableCell className="text-right">{role.grants.length}</TableCell>
                    <TableCell>
                      <Badge tone={role.isSystem ? "primary" : "neutral"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit ? (
                          <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                            Edit
                          </Button>
                        ) : null}
                        {canDelete && !role.isSystem ? (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(role)}>
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrap>
        )}
      </div>

      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        title={editor?.mode === "edit" ? `Edit ${editor.role.name}` : "New role"}
        description="Role defaults are copied when a role is selected; save with apply to update assigned users."
        size="wide"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button loading={updateRole.isPending || createRole.isPending} onClick={() => void save()}>
              Save role
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {error ? <Alert tone="destructive">{error}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role name" htmlFor="role-name" required>
              <Input
                id="role-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field label="Description" htmlFor="role-description">
              <Input
                id="role-description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Field>
          </div>
          <GrantPicker
            value={draft.grants}
            onChange={(grants) => setDraft({ ...draft, grants })}
            idPrefix="role"
          />
          {editor?.mode === "edit" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input text-primary"
                checked={draft.applyToAssigned}
                onChange={(event) => setDraft({ ...draft, applyToAssigned: event.target.checked })}
              />
              Apply these grants to users assigned to this role
            </label>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.name ?? "role"}?`}
        description="Roles assigned to users cannot be deleted."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={deleteRole.isPending} onClick={() => void confirmDelete()}>
              Delete role
            </Button>
          </>
        }
      >
        <Textarea readOnly value="Reassign affected users before deleting this role." />
      </Dialog>
    </div>
  );
}
