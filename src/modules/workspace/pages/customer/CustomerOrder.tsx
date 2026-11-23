import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightIcon, DropletIcon, TruckIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toaster";
import { formatCentavos } from "@/lib/money";
import { todayIso } from "@/lib/dates";
import { useWorkspaceStore } from "../../store";
import { selectDemoCustomer } from "../../store";
import { InfoRow, PageHeading, SectionCard } from "../../components/ui";

const windows = [
  { value: "7:00 AM – 10:00 AM", label: "Morning", sublabel: "7:00 AM – 10:00 AM" },
  { value: "10:00 AM – 1:00 PM", label: "Late morning", sublabel: "10:00 AM – 1:00 PM" },
  { value: "1:00 PM – 4:00 PM", label: "Afternoon", sublabel: "1:00 PM – 4:00 PM" },
  { value: "4:00 PM – 7:00 PM", label: "Evening", sublabel: "4:00 PM – 7:00 PM" },
];

const payments = [
  { value: "Cash on delivery", label: "Cash on delivery", sublabel: "Pay the rider on arrival" },
  { value: "GCash", label: "GCash", sublabel: "Pay online before dispatch" },
];

const orderSchema = z.object({
  jugs: z.coerce.number().int().min(1, "Order at least 1 gallon.").max(20, "Maximum 20 gallons per order."),
  scheduledDate: z.string().min(1, "Choose a delivery date."),
  scheduledWindow: z.string().min(1, "Choose a delivery window."),
  payment: z.enum(["Cash on delivery", "GCash"]),
  address: z.string().trim().min(6, "Confirm the delivery address.").max(300, "Keep the address under 300 characters."),
  notes: z.string().trim().max(300, "Keep notes under 300 characters."),
});

type OrderValues = z.infer<typeof orderSchema>;

export function CustomerOrder() {
  const state = useWorkspaceStore();
  const customer = selectDemoCustomer(state);
  const toast = useToast();
  const navigate = useNavigate();
  const [placedRef, setPlacedRef] = useState<string | null>(null);

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      jugs: 4,
      scheduledDate: todayIso(),
      scheduledWindow: windows[0]?.value ?? "",
      payment: "Cash on delivery",
      address: customer?.address ?? "",
      notes: "",
    },
  });

  const jugs = form.watch("jugs");
  const payment = form.watch("payment");
  const estimate = (Number.isFinite(Number(jugs)) ? Number(jugs) : 0) * 5500;

  const submit = form.handleSubmit((values) => {
    const order = state.placeOrder({
      jugs: values.jugs,
      scheduledDate: values.scheduledDate,
      scheduledWindow: values.scheduledWindow,
      payment: values.payment,
      notes: values.notes,
      address: values.address,
    });
    setPlacedRef(order.ref);
    toast(`Order ${order.ref} placed`, "success");
  });

  return (
    <>
      <PageHeading
        eyebrow="Place an order"
        title="One-time water delivery"
        subtitle="Choose how much you need and when we should arrive. No payment is taken now."
        actions={
          <Link to="/portal" className="ws-chip">
            Back to dashboard
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard title="Delivery details" description="All fields are validated before the order is accepted.">
          <form onSubmit={submit} noValidate className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Gallons" htmlFor="jugs" error={form.formState.errors.jugs?.message} required hint="₱55.00 per gallon, delivery included.">
                <Input id="jugs" type="number" min={1} max={20} inputMode="numeric" {...form.register("jugs")} />
              </Field>
              <Field label="Delivery date" htmlFor="scheduledDate" error={form.formState.errors.scheduledDate?.message} required>
                <Controller
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <DatePicker id="scheduledDate" value={field.value} onChange={field.onChange} minDate={todayIso()} placeholder="MM/DD/YYYY" />
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Delivery window" htmlFor="scheduledWindow" error={form.formState.errors.scheduledWindow?.message} required>
                <Controller
                  control={form.control}
                  name="scheduledWindow"
                  render={({ field }) => (
                    <SearchableSelect
                      id="scheduledWindow"
                      options={windows}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Choose a window"
                    />
                  )}
                />
              </Field>
              <Field label="Payment method" htmlFor="payment" error={form.formState.errors.payment?.message} required>
                <Controller
                  control={form.control}
                  name="payment"
                  render={({ field }) => (
                    <SearchableSelect
                      id="payment"
                      options={payments}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>

            <Field label="Delivery address" htmlFor="address" error={form.formState.errors.address?.message} required hint="Apartment, gate, or landmark details help the rider.">
              <Textarea id="address" {...form.register("address")} />
            </Field>

            <Field label="Notes for the rider" htmlFor="notes" error={form.formState.errors.notes?.message}>
              <Textarea id="notes" rows={2} placeholder="Optional. For example, leave with the guard." {...form.register("notes")} />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <div>
                <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Estimated total</p>
                <p className="text-lg font-bold">{formatCentavos(estimate)}</p>
                <p className="text-xs text-muted-foreground">
                  {payment === "GCash" ? "Pay via GCash after the order is confirmed." : "Pay the rider in cash on arrival."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => form.reset()}>
                  Reset
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Place order <ArrowRightIcon />
                </Button>
              </div>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Order summary" description="Review before placing the order.">
            <InfoRow label="Customer">{customer?.name}</InfoRow>
            <InfoRow label="Contact">{customer?.contact}</InfoRow>
            <InfoRow label="Area">{customer?.barangay}</InfoRow>
            <InfoRow label="Gallons">{`${jugs || 0} gallons`}</InfoRow>
            <InfoRow label="Rate">{`${formatCentavos(5500)} per gallon`}</InfoRow>
            <InfoRow label="Total">{formatCentavos(estimate)}</InfoRow>
          </SectionCard>

          <SectionCard title="What happens next">
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="ws-stat-icon size-7 shrink-0"><DropletIcon className="size-3.5" /></span>
                Stock is reserved when the order is confirmed, never before.
              </li>
              <li className="flex gap-2">
                <span className="ws-stat-icon is-primary size-7 shrink-0"><TruckIcon className="size-3.5" /></span>
                A rider is assigned on the delivery day and appears in Delivery Tracking.
              </li>
              <li className="flex gap-2">
                <span className="ws-stat-icon is-success size-7 shrink-0"><ArrowRightIcon className="size-3.5" /></span>
                You can cancel free of charge while the order is pending or confirmed.
              </li>
            </ol>
          </SectionCard>
        </div>
      </div>

      <Dialog
        open={placedRef !== null}
        onOpenChange={(open) => !open && setPlacedRef(null)}
        title="Order placed"
        description={placedRef ? `Reference ${placedRef}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setPlacedRef(null); form.reset(); }}>
              Order again
            </Button>
            <Button onClick={() => navigate("/portal/history")}>View order history</Button>
          </div>
        }
      >
        <p className="text-sm">
          We will confirm stock and assign a rider. Track progress any time from Delivery Tracking. This is a
          synthetic preview order and is not saved to the database.
        </p>
      </Dialog>
    </>
  );
}
