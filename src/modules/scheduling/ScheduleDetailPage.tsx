import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { StatusStepperDialog } from "@/components/ui/status-stepper-dialog";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric, formatDateTime, formatTime } from "@/lib/dates";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useChangeStatus, useSchedule } from "./hooks";
import { SCHEDULE_STATUSES } from "./schemas";

const TRANSITIONS: Record<string, string[]> = {
  Scheduled: ["Out for delivery", "Completed", "Cancelled"],
  "Out for delivery": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useSchedule(id);
  const changeStatus = useChangeStatus(id ?? "");
  const toast = useToast();
  const canEdit = usePermission("scheduling:edit");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (query.isLoading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={6} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState description={apiMessage(query.error)} />;
  }

  const schedule = query.data;
  const options = TRANSITIONS[schedule.status] ?? [];
  const editable = schedule.status === "Scheduled" || schedule.status === "Out for delivery";

  const onConfirm = async (status: string) => {
    try {
      await changeStatus.mutateAsync({ status, version: schedule.version });
      toast(
        status === "Completed"
          ? "Schedule completed. One stock movement and one sale were recorded."
          : `Schedule moved to ${status}.`,
        "success",
      );
      setDialogOpen(false);
    } catch {
      // Rendered in the dialog.
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={`Schedule · ${schedule.customerName}`}
        description={`${formatDateNumeric(schedule.scheduledDate)} at ${formatTime(schedule.scheduledTime)} (Asia/Manila)`}
        actions={
          <>
            <Link to="/scheduling" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            {editable && canEdit ? (
              <Link
                to={`/scheduling/${schedule.id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                Edit
              </Link>
            ) : null}
            {editable && canEdit ? (
              <Button onClick={() => setDialogOpen(true)}>Update status</Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(schedule.status)}>{schedule.status}</Badge>
        <span className="text-xs text-muted-foreground">
          {schedule.type} · {schedule.recurrence} · version {schedule.version}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd>
                  <Link to={`/customers/${schedule.customerId}`} className="text-primary hover:underline">
                    {schedule.customerName}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{schedule.customerCode}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assigned staff</dt>
                <dd>{schedule.assignedUserName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Gallons</dt>
                <dd>{formatNumber(schedule.gallons)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd>{formatCentavos(schedule.amountCentavos)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Completed</dt>
                <dd>{schedule.completedAt ? formatDateTime(schedule.completedAt) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd>{formatDateTime(schedule.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{schedule.notes || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Scheduled, Out for delivery, Completed, Cancelled. Completing posts the stock movement
              and sale in one server transaction. Cancelling is allowed only before completion.
            </p>
            <ol className="space-y-1">
              {SCHEDULE_STATUSES.map((status) => (
                <li key={status} className="flex items-center gap-2">
                  <span
                    className={
                      status === schedule.status
                        ? "size-2 rounded-full bg-primary"
                        : "size-2 rounded-full bg-border"
                    }
                    aria-hidden="true"
                  />
                  <span className={status === schedule.status ? "font-medium" : "text-muted-foreground"}>
                    {status}
                  </span>
                  {status === schedule.status ? <Badge tone="primary">Current</Badge> : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <StatusStepperDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        current={schedule.status}
        steps={[...SCHEDULE_STATUSES]}
        options={options}
        onConfirm={(status) => void onConfirm(status)}
        pending={changeStatus.isPending}
        title="Update schedule status"
        description="Completing the schedule records one stock movement and one sale. This cannot be undone."
      >
        {changeStatus.isError ? <Alert tone="destructive">{apiMessage(changeStatus.error)}</Alert> : null}
      </StatusStepperDialog>
    </div>
  );
}
