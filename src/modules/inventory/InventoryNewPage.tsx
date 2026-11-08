import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { useCreateItem } from "./hooks";
import { createItemSchema, type CreateItemValues } from "./schemas";

export function InventoryNewPage() {
  const navigate = useNavigate();
  const createItem = useCreateItem();
  const toast = useToast();
  const form = useForm<CreateItemValues>({
    resolver: zodResolver(createItemSchema),
    defaultValues: { name: "", sku: "", openingQuantity: 0, reorderLevel: 0 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const item = await createItem.mutateAsync(values);
      toast("Inventory item created.", "success");
      navigate(`/inventory/${item.id}`);
    } catch {
      // Rendered below.
    }
  });

  return (
    <div className="space-y-3">
      <PageHeader
        title="New inventory item"
        description="Opening stock is recorded as the first stock-in movement."
        actions={
          <Button variant="outline" onClick={() => navigate("/inventory")}>
            Back to inventory
          </Button>
        }
      />
      <form className="card-surface max-w-2xl space-y-3 p-3" onSubmit={onSubmit} noValidate>
        {createItem.isError ? <Alert tone="destructive">{apiMessage(createItem.error)}</Alert> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Item name" htmlFor="name" error={form.formState.errors.name?.message} required>
            <Input id="name" autoFocus {...form.register("name")} />
          </Field>
          <Field label="SKU" htmlFor="sku" error={form.formState.errors.sku?.message} required>
            <Input id="sku" {...form.register("sku")} />
          </Field>
          <Field
            label="Opening quantity"
            htmlFor="openingQuantity"
            error={form.formState.errors.openingQuantity?.message}
            hint="Full gallons on hand at the start."
          >
            <Input
              id="openingQuantity"
              type="number"
              min={0}
              step={1}
              {...form.register("openingQuantity", { valueAsNumber: true })}
            />
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
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" loading={createItem.isPending}>
            Create item
          </Button>
          <Button variant="outline" onClick={() => navigate("/inventory")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
