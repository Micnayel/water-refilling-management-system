import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
import { usePermission } from "@/hooks/use-permission";
import { useApproveUser, usePendingUsers, useRejectUser, useRoles } from "./hooks";

interface PendingTarget {
  id: string;
  name: string;
}

export function PendingRegistrationsPanel() {
  const query = usePendingUsers();
  const roles = useRoles();
  const approve = useApproveUser();
  const reject = useRejectUser();
  const toast = useToast();
  const canApprove = usePermission("admin:edit");
  const [rejectTarget, setRejectTarget] = useState<PendingTarget | null>(null);

  const roleName = (roleId: string | null) =>
    roles.data?.items.find((role) => role.id === roleId)?.name ?? "Customer";

  const confirmApprove = async (target: PendingTarget) => {
    try {
      await approve.mutateAsync({ id: target.id, values: {} });
      toast(`${target.name} approved with the Customer role.`, "success");
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
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Registered</TableHeaderCell>
                  {canApprove ? <TableHeaderCell className="text-right">Actions</TableHeaderCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{roleName(user.roleId)}</TableCell>
                    <TableCell>{formatDateNumeric(user.createdAt)}</TableCell>
                    {canApprove ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            loading={approve.isPending && approve.variables?.id === user.id}
                            onClick={() => void confirmApprove({ id: user.id, name: user.fullName })}
                          >
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
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrap>
        )}
      </div>

      <Alert tone="info">
        Self-registered accounts are pre-assigned the Customer role but stay inactive with no grants until
        approved. Approving activates the account immediately; change the role afterward if needed. This is
        recorded in the audit trail.
      </Alert>

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
          This is recorded in the audit trail. The person can register again with a different username or
          email.
        </p>
      </Dialog>
    </div>
  );
}
