import { Link, useParams } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric, formatDateTime, formatTime } from "@/lib/dates";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useOrder } from "./hooks";

export function OrderDetailPage() {
  const { id } = useParams();
  const query = useOrder(id);
  const canEdit = usePermission("scheduling:edit");

  if (query.isLoading) {
    return (
      <div className="card-surface p-4">
        <SkeletonRows rows={6} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        description={apiMessage(query.error)}
        action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
      />
    );
  }

  const order = query.data;

  return (
    <div className="space-y-3">
      <PageHeader
        title={`Order ${order.id.slice(0, 8)}`}
        description={`${order.customerName} · ${order.customerCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/orders" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            <Link to={`/scheduling/${order.id}`} className={buttonVariants({ variant: "outline" })}>
              Open in scheduling
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base capitalize">{order.type} order</CardTitle>
          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 pt-0 sm:grid-cols-2">
          <Info label="Customer" value={`${order.customerName} (${order.customerCode})`} />
          <Info label="Assigned staff" value={order.assignedUserName} />
          <Info label="Scheduled" value={`${formatDateNumeric(order.scheduledDate)} ${formatTime(order.scheduledTime)}`} />
          <Info label="Recurrence" value={order.recurrence} />
          <Info label="Gallons" value={formatNumber(order.gallons)} />
          <Info label="Amount" value={formatCentavos(order.amountCentavos)} />
          <Info label="Created" value={order.createdAt ? formatDateTime(order.createdAt) : "—"} />
          <Info label="Completed" value={order.completedAt ? formatDateTime(order.completedAt) : "—"} />
          {order.notes ? <Info label="Notes" value={order.notes} /> : null}
        </CardContent>
      </Card>

      {canEdit && order.status !== "Completed" && order.status !== "Cancelled" ? (
        <p className="text-xs text-muted-foreground">
          Status changes and completion happen in scheduling to keep stock and sales in sync.
        </p>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-2.5">
      <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
