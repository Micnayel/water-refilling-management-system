import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
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
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { usePermission } from "@/hooks/use-permission";
import { useRoles, useSetUserActive, useUserList } from "./hooks";

export function UserListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "pending" | "inactive">("active");
  const query = useUserList(page, pageSize, search, status);
  const roles = useRoles();
  const setActive = useSetUserActive();
  const toast = useToast();
  const navigate = useNavigate();
  const canAdd = usePermission("admin:add");
  const canEdit = usePermission("admin:edit");
  const canDelete = usePermission("admin:delete");
  const canExport = usePermission("admin:export");
  const [target, setTarget] = useState<{ id: string; name: string; action: "deactivate" | "reactivate" } | null>(
    null,
  );

  const roleName = (roleId: string | null) =>
    roles.data?.items.find((role) => role.id === roleId)?.name ?? "No role";

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const runStatusChange = async () => {
    if (!target) return;
    try {
      await setActive.mutateAsync({ id: target.id, action: target.action });
      toast(target.action === "deactivate" ? "User deactivated." : "User reactivated.", "success");
      setTarget(null);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  const exportCsv = async () => {
    try {
      await downloadFile("/users/export");
      toast("User export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="User management"
        description="Users, roles, grants, and registration approval."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            <Link to="/administration/users/pending" className={buttonVariants({ variant: "outline" })}>
              Pending registrations
            </Link>
            {canAdd ? <Button onClick={() => navigate("/administration/users/new")}>New user</Button> : null}
          </>
        }
      />

      <form className="toolbar-surface flex flex-wrap items-end gap-2" onSubmit={onSearch} role="search">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="user-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="user-search"
            placeholder="Name, email, or username"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="w-40">
          <label htmlFor="user-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect
            id="user-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="">All</option>
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      <div className="card-surface overflow-hidden">
        {query.isLoading ? (
          <div className="p-3">
            <SkeletonRows rows={6} />
          </div>
        ) : query.isError ? (
          <ErrorState
            description={apiMessage(query.error)}
            action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
          />
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState title="No users found" description="Adjust the filters or add a user." />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Username</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>Role</TableHeaderCell>
                    <TableHeaderCell className="text-right">Grants</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data?.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{roleName(user.roleId)}</TableCell>
                      <TableCell className="text-right">{user.grants.length}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit ? (
                            <Link
                              to={`/administration/users/${user.id}/edit`}
                              className={buttonVariants({ variant: "ghost", size: "sm" })}
                            >
                              Edit
                            </Link>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTarget({
                                  id: user.id,
                                  name: user.fullName,
                                  action: user.status === "active" ? "deactivate" : "reactivate",
                                })
                              }
                            >
                              {user.status === "active" ? "Deactivate" : "Reactivate"}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageSize={pageSize}
              itemCount={query.data?.items.length ?? 0}
              hasNext={Boolean(query.data?.nextCursor)}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <Alert tone="info">
        A user cannot raise their own grants, and the last active administrator cannot be deactivated.
      </Alert>

      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title={target?.action === "deactivate" ? "Deactivate user?" : "Reactivate user?"}
        description="This action is audited with opaque identifiers only."
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={target?.action === "deactivate" ? "destructive" : "default"}
              loading={setActive.isPending}
              onClick={() => void runStatusChange()}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {target?.action === "deactivate"
            ? `${target?.name} will no longer be able to sign in. The account stays on record.`
            : `${target?.name} will be able to sign in again.`}
        </p>
      </Dialog>
    </div>
  );
}
