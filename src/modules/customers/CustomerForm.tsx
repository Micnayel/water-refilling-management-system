import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiMessage } from "@/lib/api-client";
import { customerFormSchema, type CustomerFormValues } from "./schemas";

export interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
}

export function CustomerForm({
  defaultValues,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      address: "",
      barangay: "",
      latitude: null,
      longitude: null,
      ...defaultValues,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="card-surface max-w-2xl space-y-3 p-3" onSubmit={submit} noValidate>
      {error ? <Alert tone="destructive">{apiMessage(error)}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer name" htmlFor="name" error={form.formState.errors.name?.message} required>
          <Input id="name" autoFocus {...form.register("name")} />
        </Field>
        <Field label="Contact number" htmlFor="contact" error={form.formState.errors.contact?.message}>
          <Input id="contact" inputMode="tel" {...form.register("contact")} />
        </Field>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" {...form.register("email")} />
        </Field>
        <Field label="Barangay" htmlFor="barangay" error={form.formState.errors.barangay?.message}>
          <Input id="barangay" {...form.register("barangay")} />
        </Field>
      </div>
      <Field label="Delivery address" htmlFor="address" error={form.formState.errors.address?.message} required>
        <Textarea id="address" {...form.register("address")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Latitude"
          htmlFor="latitude"
          error={form.formState.errors.latitude?.message}
          hint="From a validated map pin or server geocode."
        >
          <Input
            id="latitude"
            type="number"
            step="any"
            {...form.register("latitude", {
              setValueAs: (value: string) => (value === "" ? null : Number(value)),
            })}
          />
        </Field>
        <Field
          label="Longitude"
          htmlFor="longitude"
          error={form.formState.errors.longitude?.message}
          hint="Optional until a location is confirmed."
        >
          <Input
            id="longitude"
            type="number"
            step="any"
            {...form.register("longitude", {
              setValueAs: (value: string) => (value === "" ? null : Number(value)),
            })}
          />
        </Field>
      </div>
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
