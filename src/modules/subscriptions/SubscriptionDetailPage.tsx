import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric, formatDateTime } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useSetSubscriptionStatus, useSubscription } from "./hooks";
import { FREQUENCY_LABELS } from "./schemas";

export function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useSubscription(id);
  const setStatus = useSetSubscriptionStatus();
  const toast = useToast();
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

  const sub = query.data;
  const changeStatus = async (next: string) => {
    try {
      await setStatus.mutateAsync({ id: sub.id, status: next, version: sub.version });
      toast(`Subscription ${next.toLowerCase()}.`, "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={sub.planName}
        description={`${sub.customerName} · ${sub.customerCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/subscriptions" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            {canEdit && sub.status !== "Cancelled" ? (
              <Link to={`/subscriptions/${sub.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                Edit
              </Link>
            ) : null}
            {canEdit && sub.status === "Active" ? (
              <Button variant="outline" onClick={() => void changeStatus("Paused")}>
                Pause
              </Button>
            ) : null}
            {canEdit && sub.status === "Paused" ? (
              <Button variant="outline" onClick={() => void changeStatus("Active")}>
                Resume
              </Button>
            ) : null}
            {canEdit && sub.status !== "Cancelled" ? (
              <Button variant="destructive" onClick={() => void changeStatus("Cancelled")}>
                Cancel subscription
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Details</CardTitle>
          <Badge tone={statusTone(sub.status)}>{sub.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 pt-0 sm:grid-cols-2">
          <Info label="Customer" value={`${sub.customerName} (${sub.customerCode})`} />
          <Info label="Plan" value={sub.planName} />
          <Info
            label="Frequency"
            value={FREQUENCY_LABELS[sub.frequency as keyof typeof FREQUENCY_LABELS] ?? sub.frequency}
          />
          <Info label="Gallons per delivery" value={String(sub.gallonsPerDelivery)} />
          <Info label="Price per cycle" value={formatCentavos(sub.priceCentavos)} />
          <Info label="Assigned staff" value={sub.assignedUserName} />
          <Info label="Start date" value={formatDateNumeric(sub.startDate)} />
          <Info label="Next billing" value={sub.nextBillingDate ? formatDateNumeric(sub.nextBillingDate) : "—"} />
          <Info label="Created" value={sub.createdAt ? formatDateTime(sub.createdAt) : "—"} />
          {sub.notes ? <Info label="Notes" value={sub.notes} /> : null}
        </CardContent>
      </Card>

      {sub.status !== "Cancelled" ? (
        <p className="text-xs text-muted-foreground">
          Scheduling remains the place to create deliveries; this plan records the recurring agreement.
          <Button variant="link" size="sm" onClick={() => navigate("/scheduling/new")}>
            Create a delivery
          </Button>
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
