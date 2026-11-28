import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { SubscriptionForm } from "./SubscriptionForm";
import { useCreateSubscription } from "./hooks";

export function SubscriptionNewPage() {
  const navigate = useNavigate();
  const create = useCreateSubscription();
  const toast = useToast();

  return (
    <div className="space-y-3">
      <PageHeader title="New subscription" description="Create a recurring refill plan for a customer." />
      <div className="card-surface p-4">
        <SubscriptionForm
          submitLabel="Create subscription"
          pending={create.isPending}
          error={create.error}
          onCancel={() => navigate("/subscriptions")}
          onSubmit={async (values) => {
            try {
              const created = await create.mutateAsync(values);
              toast("Subscription created.", "success");
              navigate(`/subscriptions/${created.id}`);
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
