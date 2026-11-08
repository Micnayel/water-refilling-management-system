import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { CustomerForm } from "./CustomerForm";
import { useCustomer, useUpdateCustomer } from "./hooks";
import type { CustomerFormValues } from "./schemas";

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useCustomer(id);
  const updateCustomer = useUpdateCustomer(id ?? "");
  const toast = useToast();

  if (query.isLoading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={5} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState description={apiMessage(query.error)} />;
  }

  const onSubmit = async (values: CustomerFormValues) => {
    const { latitude, longitude, ...rest } = values;
    const payload: CustomerFormValues =
      latitude === null && longitude === null ? rest : values;
    try {
      await updateCustomer.mutateAsync({ ...payload, version: query.data?.version ?? 1 });
      toast("Customer updated.", "success");
      navigate(`/customers/${id}`);
    } catch {
      // Rendered by the form.
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Edit customer"
        description="A stale version asks you to reload before saving."
        actions={
          <Button variant="outline" onClick={() => navigate(`/customers/${id}`)}>
            Back to customer
          </Button>
        }
      />
      <CustomerForm
        defaultValues={{
          name: query.data.name,
          contact: query.data.contact,
          email: query.data.email,
          address: query.data.address,
          barangay: query.data.barangay,
          latitude: null,
          longitude: null,
        }}
        submitLabel="Save changes"
        pending={updateCustomer.isPending}
        error={updateCustomer.error}
        onSubmit={onSubmit}
        onCancel={() => navigate(`/customers/${id}`)}
      />
    </div>
  );
}
