import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { movementFormSchema, MOVEMENT_LABELS, type InventoryItem, type MovementValues } from "./schemas";
import { useRecordStock } from "./hooks";

export interface AddStockDialogProps {
  open: boolean;
  items: InventoryItem[];
  onOpenChange: (open: boolean) => void;
}

/**
 * Adds or adjusts gallon stock from the list without opening an item first.
 * The movement is still recorded immutably for the chosen item.
 */
export function AddStockDialog({ open, items, onOpenChange }: AddStockDialogProps) {
  const recordStock = useRecordStock();
  const toast = useToast();
  const [itemId, setItemId] = useState("");
  const form = useForm<MovementValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: { type: "in", quantity: 1, reason: "" },
  });

  // Start on the first available item each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setItemId(items[0]?.id ?? "");
    form.reset({ type: "in", quantity: 1, reason: "" });
    recordStock.reset();
    // Resetting on open only; the form is user-owned while it stays open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  const selected = items.find((item) => item.id === itemId);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selected) return;
    try {
      await recordStock.mutateAsync({ id: selected.id, values: { ...values, version: selected.version } });
      toast("Stock added to the inventory item.", "success");
      onOpenChange(false);
    } catch {
      // Rendered in the dialog.
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add gallon stock"
      description="Choose an item and record an immutable stock movement."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} loading={recordStock.isPending} disabled={!selected}>
            Add stock
          </Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        {recordStock.isError ? <Alert tone="destructive">{apiMessage(recordStock.error)}</Alert> : null}
        {items.length === 0 ? (
          <Alert tone="info">
            Add an inventory item first, then return here to record stock.
          </Alert>
        ) : null}
        <Field label="Item" htmlFor="stock-item" required>
          <SearchableSelect
            id="stock-item"
            options={items.map((item) => ({
              value: item.id,
              label: item.name,
              sublabel: `${item.sku} · ${item.gallonsFull} full`,
            }))}
            value={itemId}
            onChange={setItemId}
            placeholder="Select an item"
            searchPlaceholder="Search item or SKU…"
          />
        </Field>
        <Field label="Movement type" htmlFor="stock-type" required>
          <NativeSelect id="stock-type" {...form.register("type")}>
            {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Quantity"
          htmlFor="stock-quantity"
          error={form.formState.errors.quantity?.message}
          hint="Use a negative number only for an adjustment."
          required
        >
          <Input
            id="stock-quantity"
            type="number"
            step={1}
            {...form.register("quantity", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Reason" htmlFor="stock-reason" error={form.formState.errors.reason?.message} required>
          <Textarea id="stock-reason" placeholder="Why is stock changing?" {...form.register("reason")} />
        </Field>
      </form>
    </Dialog>
  );
}
