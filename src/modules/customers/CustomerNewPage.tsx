import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { CustomerForm } from "./CustomerForm";
import { useCreateCustomer } from "./hooks";
import type { CustomerFormValues } from "./schemas";

export function CustomerNewPage() {
  const navigate = useNavigate();
  const createCustomer = useCreateCustomer();
  const toast = useToast();

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const customer = await createCustomer.mutateAsync(values);
      toast("Customer created.", "success");
      navigate(`/customers/${customer.id}`);
    } catch {
      // Rendered by the form.
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="New customer"
        description="Contact details and location are sensitive and masked by default."
        actions={
          <Button variant="outline" onClick={() => navigate("/customers")}>
            Back to customers
          </Button>
        }
      />
      <CustomerForm
        submitLabel="Create customer"
        pending={createCustomer.isPending}
        error={createCustomer.error}
        onSubmit={onSubmit}
        onCancel={() => navigate("/customers")}
      />
    </div>
  );
}
