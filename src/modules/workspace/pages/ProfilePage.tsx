import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { formatDateNumeric } from "@/lib/dates";
import { useLogoutMutation } from "@/modules/auth";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore, selectDemoCustomer } from "../store";
import { customerMetrics, planFor } from "../selectors";
import { InfoRow, PageHeading, SectionCard, StatusPill } from "../components/ui";
import type { WorkspaceRole } from "../types";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(160),
  email: z.string().trim().email("Enter a valid email."),
  contact: z.string().trim().min(7, "Enter a contact number.").max(32),
  address: z.string().trim().min(6, "Enter your delivery address.").max(300),
  barangay: z.string().trim().min(2, "Enter your barangay.").max(120),
});

type CustomerValues = z.infer<typeof customerSchema>;

const riderSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(160),
  email: z.string().trim().email("Enter a valid email."),
  contact: z.string().trim().min(7, "Enter a contact number.").max(32),
  zone: z.string().trim().min(2, "Describe your route.").max(160),
  vehicle: z.string().trim().min(2, "Enter the vehicle and plate.").max(120),
  shift: z.string().trim().min(2, "Enter your shift.").max(80),
});

type RiderValues = z.infer<typeof riderSchema>;

function SecurityCard({ role }: { role: WorkspaceRole }) {
  const user = useSessionStore((state) => state.user);
  const logout = useLogoutMutation();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <SectionCard title="Account and security" description="Session details come from the live API.">
      <InfoRow label="Signed in as">{user?.fullName ?? "Preview user"}</InfoRow>
      <InfoRow label="Email">{user?.email ?? "—"}</InfoRow>
      <InfoRow label="Role">{user?.roleId ?? role}</InfoRow>
      <InfoRow label="Grants">{`${user?.grants.length ?? 0} permissions`}</InfoRow>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to="/settings">
          <Button variant="outline" size="sm">Appearance and settings</Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => void onLogout()}>
          Sign out
        </Button>
      </div>
      <p className="mt-2 text-[0.6875rem] text-muted-foreground">
        Profile edits on this page are held in the browser preview and are never written to the database.
      </p>
    </SectionCard>
  );
}

function CustomerProfile() {
  const state = useWorkspaceStore();
  const customer = selectDemoCustomer(state);
  const metrics = customerMetrics(state);
  const plan = planFor(state, metrics.activeSubscription?.planId);
  const toast = useToast();

  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email,
      contact: customer.contact,
      address: customer.address,
      barangay: customer.barangay,
    },
  });

  const submit = form.handleSubmit((values) => {
    state.updateCustomerProfile(values);
    toast("Profile updated in this preview", "success");
  });

  return (
    <>
      <PageHeading
        eyebrow="My profile"
        title="Account details"
        subtitle="Keep your contact and delivery details current so riders can reach you."
        actions={<StatusPill status="Active" />}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard title="Personal information" description="Sensitive fields are masked elsewhere in the app.">
          <form onSubmit={submit} noValidate className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" error={form.formState.errors.name?.message} required>
                <Input id="name" {...form.register("name")} />
              </Field>
              <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
                <Input id="email" type="email" {...form.register("email")} />
              </Field>
              <Field label="Contact number" htmlFor="contact" error={form.formState.errors.contact?.message} required>
                <Input id="contact" inputMode="tel" {...form.register("contact")} />
              </Field>
              <Field label="Barangay" htmlFor="barangay" error={form.formState.errors.barangay?.message} required>
                <Input id="barangay" {...form.register("barangay")} />
              </Field>
            </div>
            <Field label="Delivery address" htmlFor="address" error={form.formState.errors.address?.message} required hint="Include gate, unit, or landmark notes.">
              <Textarea id="address" {...form.register("address")} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => form.reset()}>
                Discard changes
              </Button>
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Customer record">
            <InfoRow label="Customer code">{customer.code}</InfoRow>
            <InfoRow label="Member since">{formatDateNumeric(customer.joinedAt)}</InfoRow>
            <InfoRow label="Status">{customer.status}</InfoRow>
            <InfoRow label="Plan">{plan?.name ?? "No active plan"}</InfoRow>
            <InfoRow label="Monthly visits">{`${metrics.activeSubscription?.deliveriesThisMonth ?? 0} deliveries`}</InfoRow>
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
              <Badge tone="primary">Note</Badge>
              {customer.notes}
            </p>
          </SectionCard>
          <SecurityCard role="customer" />
        </div>
      </div>
    </>
  );
}

function RiderProfilePage() {
  const state = useWorkspaceStore();
  const rider = state.rider;
  const toast = useToast();

  const form = useForm<RiderValues>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      name: rider.name,
      email: rider.email,
      contact: rider.contact,
      zone: rider.zone,
      vehicle: rider.vehicle,
      shift: rider.shift,
    },
  });

  const submit = form.handleSubmit((values) => {
    state.updateRiderProfile(values);
    toast("Profile updated in this preview", "success");
  });

  return (
    <>
      <PageHeading
        eyebrow="My profile"
        title="Rider details"
        subtitle="Your route, vehicle, and shift are visible to dispatch."
        actions={<StatusPill status={rider.status} />}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard title="Personal information">
          <form onSubmit={submit} noValidate className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" htmlFor="rname" error={form.formState.errors.name?.message} required>
                <Input id="rname" {...form.register("name")} />
              </Field>
              <Field label="Email" htmlFor="remail" error={form.formState.errors.email?.message} required>
                <Input id="remail" type="email" {...form.register("email")} />
              </Field>
              <Field label="Contact number" htmlFor="rcontact" error={form.formState.errors.contact?.message} required>
                <Input id="rcontact" inputMode="tel" {...form.register("contact")} />
              </Field>
              <Field label="Shift" htmlFor="rshift" error={form.formState.errors.shift?.message} required>
                <Input id="rshift" {...form.register("shift")} />
              </Field>
              <Field label="Zone" htmlFor="rzone" error={form.formState.errors.zone?.message} required>
                <Input id="rzone" {...form.register("zone")} />
              </Field>
              <Field label="Vehicle" htmlFor="rvehicle" error={form.formState.errors.vehicle?.message} required>
                <Input id="rvehicle" {...form.register("vehicle")} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => form.reset()}>
                Discard changes
              </Button>
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Duty status" description="Dispatch uses this to assign new stops.">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{rider.status}</p>
                <p className="text-xs text-muted-foreground">{rider.shift} · {rider.zone}</p>
              </div>
              <Button
                variant={rider.status === "On duty" ? "outline" : "default"}
                onClick={() => {
                  const next = rider.status === "On duty" ? "Off duty" : "On duty";
                  state.updateRiderProfile({ status: next });
                  toast(`You are now ${next.toLowerCase()}`, "success");
                }}
              >
                {rider.status === "On duty" ? "Go off duty" : "Go on duty"}
              </Button>
            </div>
            <div className="mt-3">
              <InfoRow label="Vehicle">{rider.vehicle}</InfoRow>
              <InfoRow label="Contact">{rider.contact}</InfoRow>
            </div>
          </SectionCard>
          <SecurityCard role="rider" />
        </div>
      </div>
    </>
  );
}

function AdminProfile() {
  return (
    <>
      <PageHeading
        eyebrow="Administrator"
        title="Account and access"
        subtitle="Administrators manage users, roles, and system settings from the control center."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Profile">
          <SecurityCard role="admin" />
        </SectionCard>
        <SectionCard title="Administration shortcuts">
          <div className="grid gap-2">
            <Link to="/administration/users" className="ws-quick">
              <span className="ws-quick-icon"><Badge tone="primary">U</Badge></span>
              <span>
                <span className="block text-sm font-semibold">User management</span>
                <span className="block text-xs text-muted-foreground">Approve registrations and assign grants.</span>
              </span>
            </Link>
            <Link to="/settings" className="ws-quick">
              <span className="ws-quick-icon"><Badge tone="primary">S</Badge></span>
              <span>
                <span className="block text-sm font-semibold">System settings</span>
                <span className="block text-xs text-muted-foreground">Templates, sessions, and maintenance.</span>
              </span>
            </Link>
            <Link to="/audit" className="ws-quick">
              <span className="ws-quick-icon"><Badge tone="primary">A</Badge></span>
              <span>
                <span className="block text-sm font-semibold">Audit trail</span>
                <span className="block text-xs text-muted-foreground">Review sensitive reads and changes.</span>
              </span>
            </Link>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

export function ProfilePage({ role }: { role: WorkspaceRole }) {
  if (role === "customer") return <CustomerProfile />;
  if (role === "rider") return <RiderProfilePage />;
  return <AdminProfile />;
}
