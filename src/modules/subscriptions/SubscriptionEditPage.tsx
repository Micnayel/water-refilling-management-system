import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { SubscriptionForm } from "./SubscriptionForm";
import { useSubscription, useUpdateSubscription } from "./hooks";
import { SUBSCRIPTION_FREQUENCIES, SUBSCRIPTION_STATUSES } from "./schemas";

export function SubscriptionEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useSubscription(id);
  const update = useUpdateSubscription(id ?? "");
  const toast = useToast();

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
  const status = (SUBSCRIPTION_STATUSES as readonly string[]).includes(sub.status)
    ? (sub.status as (typeof SUBSCRIPTION_STATUSES)[number])
    : "Active";
  const frequency = (SUBSCRIPTION_FREQUENCIES as readonly string[]).includes(sub.frequency)
    ? (sub.frequency as (typeof SUBSCRIPTION_FREQUENCIES)[number])
    : "weekly";

  return (
    <div className="space-y-3">
      <PageHeader title="Edit subscription" description={`${sub.planName} · ${sub.customerName}`} />
      <div className="card-surface p-4">
        <SubscriptionForm
          submitLabel="Save changes"
          pending={update.isPending}
          error={update.error}
          defaultValues={{
            customerId: sub.customerId,
            planName: sub.planName,
            status,
            gallonsPerDelivery: sub.gallonsPerDelivery,
            frequency,
            priceCentavos: sub.priceCentavos,
            startDate: sub.startDate,
            nextBillingDate: sub.nextBillingDate ?? "",
            assignedUserId: sub.assignedUserId ?? "",
            notes: sub.notes,
          }}
          onCancel={() => navigate(`/subscriptions/${sub.id}`)}
          onSubmit={async (values) => {
            try {
              await update.mutateAsync({ ...values, version: sub.version });
              toast("Subscription updated.", "success");
              navigate(`/subscriptions/${sub.id}`);
            } catch (error) {
              toast(apiMessage(error), "error");
              throw error;
            }
          }}
        />
      </div>
    </div>
  );
}
