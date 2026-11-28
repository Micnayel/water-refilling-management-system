import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { apiMessage } from "@/lib/api-client";
import { todayIso } from "@/lib/dates";
import { queryCustomers } from "@/modules/customers";
import { useAssignees } from "./hooks";
import {
  FREQUENCY_LABELS,
  SUBSCRIPTION_FREQUENCIES,
  SUBSCRIPTION_STATUSES,
  subscriptionFormSchema,
  type SubscriptionFormValues,
} from "./schemas";

export interface SubscriptionFormProps {
  defaultValues?: Partial<SubscriptionFormValues>;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: SubscriptionFormValues) => Promise<void>;
  onCancel: () => void;
}

export function SubscriptionForm({
  defaultValues,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: SubscriptionFormProps) {
  const customers = useQuery({
    queryKey: ["customers", "options"],
    queryFn: () => queryCustomers({ pageSize: 100, status: "active" }),
    staleTime: 60_000,
  });
  const assignees = useAssignees();

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      customerId: "",
      planName: "Standard refill",
      status: "Active",
      gallonsPerDelivery: 1,
      frequency: "weekly",
      priceCentavos: 0,
      startDate: todayIso(),
      nextBillingDate: "",
      assignedUserId: "",
      notes: "",
      ...defaultValues,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="space-y-3" onSubmit={(event) => void submit(event)} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer" htmlFor="sub-customer" error={form.formState.errors.customerId?.message}>
          <Controller
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <SearchableSelect
                id="sub-customer"
                options={
                  customers.data?.items.map((customer) => ({
                    value: customer.id,
                    label: customer.name,
                    sublabel: customer.code,
                  })) ?? []
                }
                value={field.value}
                onChange={field.onChange}
                placeholder={customers.isLoading ? "Loading customers…" : "Select a customer"}
                emptyMessage="No active customers found."
              />
            )}
          />
        </Field>

        <Field label="Plan name" htmlFor="sub-plan" error={form.formState.errors.planName?.message}>
          <Input id="sub-plan" {...form.register("planName")} placeholder="Standard refill" />
        </Field>

        <Field label="Status" htmlFor="sub-status" error={form.formState.errors.status?.message}>
          <NativeSelect id="sub-status" {...form.register("status")}>
            {SUBSCRIPTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Frequency" htmlFor="sub-frequency" error={form.formState.errors.frequency?.message}>
          <NativeSelect id="sub-frequency" {...form.register("frequency")}>
            {SUBSCRIPTION_FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {FREQUENCY_LABELS[frequency]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label="Gallons per delivery"
          htmlFor="sub-gallons"
          error={form.formState.errors.gallonsPerDelivery?.message}
        >
          <Input
            id="sub-gallons"
            type="number"
            min={1}
            {...form.register("gallonsPerDelivery", { valueAsNumber: true })}
          />
        </Field>

        <Field label="Price per cycle" htmlFor="sub-price" error={form.formState.errors.priceCentavos?.message}>
          <Controller
            control={form.control}
            name="priceCentavos"
            render={({ field }) => (
              <MoneyInput
                id="sub-price"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </Field>

        <Field label="Start date" htmlFor="sub-start" error={form.formState.errors.startDate?.message}>
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => <DatePicker id="sub-start" value={field.value} onChange={field.onChange} />}
          />
        </Field>

        <Field label="Next billing date" htmlFor="sub-next" error={form.formState.errors.nextBillingDate?.message}>
          <Controller
            control={form.control}
            name="nextBillingDate"
            render={({ field }) => (
              <DatePicker id="sub-next" value={field.value} onChange={field.onChange} placeholder="Optional" />
            )}
          />
        </Field>

        <Field label="Assigned staff" htmlFor="sub-assigned" error={form.formState.errors.assignedUserId?.message}>
          <NativeSelect id="sub-assigned" {...form.register("assignedUserId")}>
            <option value="">Unassigned</option>
            {(assignees.data?.items ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field label="Notes" htmlFor="sub-notes" error={form.formState.errors.notes?.message}>
        <Textarea id="sub-notes" {...form.register("notes")} maxLength={500} />
      </Field>

      {customers.isError ? <Alert tone="destructive">{apiMessage(customers.error)}</Alert> : null}
      {error ? <Alert tone="destructive">{apiMessage(error)}</Alert> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
