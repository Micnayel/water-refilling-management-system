import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric } from "@/lib/dates";
import { GrantPicker } from "./GrantPicker";
import { useApproveUser, usePendingUsers, useRejectUser, useRoles } from "./hooks";

interface PendingTarget {
  id: string;
  name: string;
}

export function PendingRegistrationsPage() {
  const query = usePendingUsers();
  const roles = useRoles();
  const approve = useApproveUser();
  const reject = useRejectUser();
  const toast = useToast();
  const [approveTarget, setApproveTarget] = useState<PendingTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingTarget | null>(null);
  const [roleId, setRoleId] = useState("");
  const [grants, setGrants] = useState<string[]>([]);

  const openApprove = (target: PendingTarget) => {
    setApproveTarget(target);
    setRoleId("");
    setGrants([]);
  };

  const onRoleChange = (value: string) => {
    setRoleId(value);
    const role = roles.data?.items.find((entry) => entry.id === value);
    if (role) setGrants(role.grants);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await approve.mutateAsync({
        id: approveTarget.id,
        values: { roleId: roleId || null, grants },
      });
      toast("Registration approved.", "success");
      setApproveTarget(null);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await reject.mutateAsync(rejectTarget.id);
      toast("Registration rejected.", "success");
      setRejectTarget(null);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Pending registrations"
        description="Self-registered accounts stay inactive with no grants until approved."
        actions={
          <Link to="/administration/users" className={buttonVariants({ variant: "outline" })}>
            Back to users
          </Link>
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
          <EmptyState title="No pending registrations" description="New registrations appear here for review." />
        ) : (
          <TableWrap>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Username</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Registered</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{formatDateNumeric(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => openApprove({ id: user.id, name: user.fullName })}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectTarget({ id: user.id, name: user.fullName })}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrap>
        )}
      </div>

      <Alert tone="info">
        Approval activates the account. Pending accounts cannot sign in and receive no grants until
        an administrator approves them.
      </Alert>

      <Dialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
        title={`Approve ${approveTarget?.name ?? "registration"}`}
        description="Assign a role and grants. Approval is audited."
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>
              Cancel
            </Button>
            <Button loading={approve.isPending} onClick={() => void confirmApprove()}>
              Approve account
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="approve-role" className="text-xs font-medium text-muted-foreground">
              Role
            </label>
            <NativeSelect
              id="approve-role"
              value={roleId}
              onChange={(event) => onRoleChange(event.target.value)}
            >
              <option value="">No role</option>
              {roles.data?.items.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <GrantPicker value={grants} onChange={setGrants} idPrefix="approve" />
        </div>
      </Dialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title={`Reject ${rejectTarget?.name ?? "registration"}`}
        description="The account stays inactive and cannot sign in."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={reject.isPending} onClick={() => void confirmReject()}>
              Reject
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This is recorded in the audit trail. The person can register again with a different
          username or email.
        </p>
      </Dialog>
    </div>
  );
}
