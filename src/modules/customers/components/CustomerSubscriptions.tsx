import { Link } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { CalendarIcon, PlusIcon } from "@/components/ui/icons";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useCustomerSubscriptions, useSetSubscriptionStatus, FREQUENCY_LABELS, type Subscription } from "@/modules/subscriptions";

export function CustomerSubscriptions({ customerId }: { customerId: string }) {
  const query = useCustomerSubscriptions(customerId);
  const setStatus = useSetSubscriptionStatus();
  const toast = useToast();
  const canView = usePermission("scheduling:view");
  const canAdd = usePermission("scheduling:add");
  const canManage = usePermission("scheduling:edit");

  if (!canView) return null;

  const changeStatus = async (sub: Subscription, next: string) => {
    try {
      await setStatus.mutateAsync({ id: sub.id, status: next, version: sub.version });
      toast(`Subscription ${next.toLowerCase()}.`, "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  const items = query.data?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <CalendarIcon className="size-4 text-primary" /> Subscriptions
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{items.length}</Badge>
          {canAdd ? (
            <Link
              to={`/subscriptions/new?customerId=${encodeURIComponent(customerId)}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PlusIcon className="size-3.5" /> Add plan
            </Link>
          ) : null}
          <Link to="/subscriptions" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Manage all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {query.isLoading ? (
          <SkeletonRows rows={3} />
        ) : query.isError ? (
          <ErrorState
            description={apiMessage(query.error)}
            action={<Button variant="outline" size="sm" onClick={() => void query.refetch()}>Try again</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No subscriptions"
            description="This customer has no recurring refill plans yet."
            action={
              canAdd ? (
                <Link
                  to={`/subscriptions/new?customerId=${encodeURIComponent(customerId)}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <PlusIcon className="size-3.5" /> Add subscription
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-2">
            {items.map((sub) => (
              <li key={sub.id} className="rounded-lg border border-border/70 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/subscriptions/${sub.id}`} className="text-sm font-medium hover:underline">
                      {sub.planName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[sub.frequency as keyof typeof FREQUENCY_LABELS] ?? sub.frequency} ·{" "}
                      {sub.gallonsPerDelivery} gal · {formatCentavos(sub.priceCentavos)}
                      {sub.nextBillingDate ? ` · next ${formatDateNumeric(sub.nextBillingDate)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge tone={statusTone(sub.status)}>{sub.status}</Badge>
                    {canManage && sub.status !== "Cancelled" ? (
                      <Link to={`/subscriptions/${sub.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Edit
                      </Link>
                    ) : null}
                    {canManage && sub.status === "Active" ? (
                      <Button variant="ghost" size="sm" onClick={() => void changeStatus(sub, "Paused")}>
                        Pause
                      </Button>
                    ) : null}
                    {canManage && sub.status === "Paused" ? (
                      <Button variant="ghost" size="sm" onClick={() => void changeStatus(sub, "Active")}>
                        Resume
                      </Button>
                    ) : null}
                    {canManage && sub.status !== "Cancelled" ? (
                      <Button variant="ghost" size="sm" onClick={() => void changeStatus(sub, "Cancelled")}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {canManage ? (
          <p className="mt-2 text-[0.625rem] text-muted-foreground">
            Administrators and managers with scheduling edit can manage plans; every change is audited.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
