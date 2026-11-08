import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { useInventoryItem, useUpdateItem } from "./hooks";
import { updateItemSchema, type UpdateItemValues } from "./schemas";

export function InventoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useInventoryItem(id);
  const updateItem = useUpdateItem(id ?? "");
  const toast = useToast();
  const form = useForm<UpdateItemValues>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: { name: "", reorderLevel: 0 },
  });

  useEffect(() => {
    if (query.data) {
      form.reset({ name: query.data.name, reorderLevel: query.data.reorderLevel });
    }
  }, [query.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!query.data) return;
    try {
      await updateItem.mutateAsync({ ...values, version: query.data.version });
      toast("Inventory item updated.", "success");
      navigate(`/inventory/${query.data.id}`);
    } catch {
      // Rendered below.
    }
  });

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

  return (
    <div className="space-y-3">
      <PageHeader
        title="Edit inventory item"
        description="Stock quantities change only through stock movements."
        actions={
          <Button variant="outline" onClick={() => navigate(`/inventory/${query.data?.id}`)}>
            Back to item
          </Button>
        }
      />
      <form className="card-surface max-w-2xl space-y-3 p-3" onSubmit={onSubmit} noValidate>
        {updateItem.isError ? <Alert tone="destructive">{apiMessage(updateItem.error)}</Alert> : null}
        <Field label="Item name" htmlFor="name" error={form.formState.errors.name?.message} required>
          <Input id="name" autoFocus {...form.register("name")} />
        </Field>
        <Field
          label="Reorder level"
          htmlFor="reorderLevel"
          error={form.formState.errors.reorderLevel?.message}
          hint="Full stock at or below this level is flagged."
        >
          <Input
            id="reorderLevel"
            type="number"
            min={0}
            step={1}
            {...form.register("reorderLevel", { valueAsNumber: true })}
          />
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit" loading={updateItem.isPending}>
            Save changes
          </Button>
          <Button variant="outline" onClick={() => navigate(`/inventory/${query.data?.id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
