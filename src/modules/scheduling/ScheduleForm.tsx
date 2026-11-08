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
import { scheduleFormSchema, type ScheduleFormValues } from "./schemas";

export interface ScheduleFormProps {
  defaultValues?: Partial<ScheduleFormValues>;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: ScheduleFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ScheduleForm({
  defaultValues,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: ScheduleFormProps) {
  const customers = useQuery({
    queryKey: ["customers", "options"],
    queryFn: () => queryCustomers({ pageSize: 100, status: "active" }),
    staleTime: 60_000,
  });
  const assignees = useAssignees();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      customerId: "",
      assignedUserId: "",
      type: "delivery",
      recurrence: "one-time",
      scheduledDate: todayIso(),
      scheduledTime: "09:00",
      gallons: 1,
      amountCentavos: 0,
      notes: "",
      ...defaultValues,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const customerOptions =
    customers.data?.items.map((customer) => ({
      value: customer.id,
      label: customer.name,
      sublabel: customer.code,
    })) ?? [];

  const assigneeOptions =
    assignees.data?.items.map((user) => ({ value: user.id, label: user.fullName })) ?? [];

  return (
    <form className="card-surface max-w-3xl space-y-3 p-3" onSubmit={submit} noValidate>
      {error ? <Alert tone="destructive">{apiMessage(error)}</Alert> : null}
      {customers.isError ? (
        <Alert tone="warning">Customer options could not be loaded. {apiMessage(customers.error)}</Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Customer"
          htmlFor="customerId"
          error={form.formState.errors.customerId?.message}
          required
        >
          <Controller
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <SearchableSelect
                id="customerId"
                options={customerOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={customers.isLoading ? "Loading customers…" : "Select a customer"}
                emptyMessage="No active customers found."
                aria-invalid={Boolean(form.formState.errors.customerId)}
              />
            )}
          />
        </Field>

        <Field
          label="Assigned staff"
          htmlFor="assignedUserId"
          error={form.formState.errors.assignedUserId?.message}
          required
        >
          <Controller
            control={form.control}
            name="assignedUserId"
            render={({ field }) => (
              <SearchableSelect
                id="assignedUserId"
                options={assigneeOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={assignees.isLoading ? "Loading staff…" : "Select staff"}
                emptyMessage="No active staff found."
                aria-invalid={Boolean(form.formState.errors.assignedUserId)}
              />
            )}
          />
        </Field>

        <Field label="Type" htmlFor="type" required>
          <NativeSelect id="type" {...form.register("type")}>
            <option value="delivery">Delivery</option>
            <option value="refill">Refill</option>
          </NativeSelect>
        </Field>

        <Field label="Recurrence" htmlFor="recurrence" required>
          <NativeSelect id="recurrence" {...form.register("recurrence")}>
            <option value="one-time">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </NativeSelect>
        </Field>

        <Field
          label="Date"
          htmlFor="scheduledDate"
          error={form.formState.errors.scheduledDate?.message}
          required
        >
          <Controller
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <DatePicker
                id="scheduledDate"
                value={field.value}
                onChange={field.onChange}
                aria-invalid={Boolean(form.formState.errors.scheduledDate)}
              />
            )}
          />
        </Field>

        <Field
          label="Time (Asia/Manila)"
          htmlFor="scheduledTime"
          error={form.formState.errors.scheduledTime?.message}
          required
        >
          <Input id="scheduledTime" type="time" {...form.register("scheduledTime")} />
        </Field>

        <Field
          label="Gallons"
          htmlFor="gallons"
          error={form.formState.errors.gallons?.message}
          required
        >
          <Input
            id="gallons"
            type="number"
            min={1}
            step={1}
            {...form.register("gallons", { valueAsNumber: true })}
          />
        </Field>

        <Field
          label="Amount"
          htmlFor="amountCentavos"
          error={form.formState.errors.amountCentavos?.message}
          hint="Recorded as a sale when the schedule is completed."
          required
        >
          <Controller
            control={form.control}
            name="amountCentavos"
            render={({ field }) => (
              <MoneyInput
                id="amountCentavos"
                value={field.value}
                onValueChange={field.onChange}
                aria-invalid={Boolean(form.formState.errors.amountCentavos)}
              />
            )}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" error={form.formState.errors.notes?.message}>
        <Textarea id="notes" placeholder="Access instructions or delivery notes" {...form.register("notes")} />
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
