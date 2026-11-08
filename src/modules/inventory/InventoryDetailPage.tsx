import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, NativeSelect } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";
import { formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useAddMovement, useInventoryItem, useInventoryMovements } from "./hooks";
import {
  MOVEMENT_LABELS,
  movementFormSchema,
  type MovementValues,
} from "./schemas";

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useInventoryItem(id);
  const movements = useInventoryMovements(id);
  const addMovement = useAddMovement(id ?? "");
  const toast = useToast();
  const canEdit = usePermission("inventory:edit");
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<MovementValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: { type: "in", quantity: 1, reason: "" },
  });

  if (query.isLoading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={6} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState description={apiMessage(query.error)} />;
  }

  const item = query.data;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await addMovement.mutateAsync({ ...values, version: item.version });
      toast("Stock movement recorded.", "success");
      setDialogOpen(false);
      form.reset({ type: values.type, quantity: 1, reason: "" });
    } catch {
      // Rendered in the dialog.
    }
  });

  const summary = [
    { label: "Full", value: item.gallonsFull },
    { label: "Empty", value: item.gallonsEmpty },
    { label: "With customer", value: item.gallonsWithCustomer },
    { label: "Damaged", value: item.gallonsDamaged },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        title={item.name}
        description={`SKU ${item.sku} · reorder level ${formatNumber(item.reorderLevel)}`}
        actions={
          <>
            <Link to="/inventory" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            {canEdit ? (
              <>
                <Link to={`/inventory/${item.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                  Edit
                </Link>
                <Button onClick={() => setDialogOpen(true)}>Record movement</Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((entry) => (
          <Card key={entry.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{entry.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatNumber(entry.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Badge tone={item.lowStock ? "warning" : statusTone("active")}>
          {item.lowStock ? "Low stock" : "In stock"}
        </Badge>
        <span className="text-xs text-muted-foreground">Version {item.version}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock movements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.isLoading ? (
            <div className="p-3">
              <SkeletonRows rows={4} />
            </div>
          ) : movements.isError ? (
            <ErrorState description={apiMessage(movements.error)} />
          ) : movements.data && movements.data.items.length === 0 ? (
            <EmptyState title="No movements yet" description="Recorded stock changes appear here." />
          ) : (
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>When</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
                    <TableHeaderCell>Reason</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.data?.items.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(movement.createdAt)}
                      </TableCell>
                      <TableCell>{MOVEMENT_LABELS[movement.type] ?? movement.type}</TableCell>
                      <TableCell className="text-right">{movement.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{movement.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Record stock movement"
        description="Every change needs a type, quantity, and reason."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onSubmit()} loading={addMovement.isPending}>
              Record movement
            </Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          {addMovement.isError ? (
            <Alert tone="destructive">{apiMessage(addMovement.error)}</Alert>
          ) : null}
          <Field label="Movement type" htmlFor="type" required>
            <NativeSelect id="type" {...form.register("type")}>
              {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label="Quantity"
            htmlFor="quantity"
            error={form.formState.errors.quantity?.message}
            hint="Use a negative number only for an adjustment."
            required
          >
            <Input
              id="quantity"
              type="number"
              step={1}
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Reason" htmlFor="reason" error={form.formState.errors.reason?.message} required>
            <Textarea id="reason" placeholder="Why is stock changing?" {...form.register("reason")} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
