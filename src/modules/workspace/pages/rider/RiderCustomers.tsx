import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { MaskedValue } from "@/components/privacy/masked-value";
import { MapPinIcon, SearchIcon, TruckIcon, UsersIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { useWorkspaceStore } from "../../store";
import { ContactDialog } from "../../components/dialogs";
import { InfoRow, PageHeading, SectionCard, StatusPill } from "../../components/ui";
import type { DemoCustomer, Delivery } from "../../types";

export function RiderCustomers() {
  const state = useWorkspaceStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DemoCustomer | null>(null);
  const [contact, setContact] = useState<DemoCustomer | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const assignedIds = useMemo(
    () => Array.from(new Set(state.deliveries.filter((row) => row.rider === state.rider.name).map((row) => row.customerId))),
    [state.deliveries, state.rider.name],
  );

  const customers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return state.customers
      .filter((row) => assignedIds.includes(row.id))
      .filter((row) => !term || row.name.toLowerCase().includes(term) || row.barangay.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.customers, assignedIds, query]);

  const deliveriesFor = (customerId: string): Delivery[] =>
    state.deliveries.filter((row) => row.customerId === customerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <>
      <PageHeading
        eyebrow="Customer information"
        title="People on your route"
        subtitle="Contact details stay masked until you reveal them for a delivery."
        actions={
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search customers" className="w-56 pl-7" placeholder="Name or barangay" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        }
      />

      {customers.length === 0 ? (
        <SectionCard>
          <EmptyState title="No customers match" description="Only customers assigned to your route are listed here." />
        </SectionCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => {
            const latest = deliveriesFor(customer.id)[0];
            const revealed = revealedId === customer.id;
            return (
              <article key={customer.id} className="ws-card flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{customer.name}</h2>
                    <p className="text-xs text-muted-foreground">{customer.code} · {customer.barangay}</p>
                  </div>
                  <StatusPill status={customer.status} />
                </div>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
                  {customer.address}
                </p>
                <div className="text-xs">
                  <MaskedValue
                    value={customer.contact}
                    revealed={revealed}
                    canReveal
                    onReveal={() => setRevealedId(customer.id)}
                    onHide={() => setRevealedId(null)}
                    revealLabel={`Reveal contact for ${customer.name}`}
                  />
                </div>
                {latest ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TruckIcon className="size-3.5" /> {latest.ref} · {latest.status} · {formatDateNumeric(latest.updatedAt)}
                  </p>
                ) : null}
                <div className="mt-auto flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setContact(customer)}>
                    Contact
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(customer)}>
                    Details
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ContactDialog
        open={contact !== null}
        onOpenChange={(open) => !open && setContact(null)}
        name={contact?.name ?? ""}
        contact={contact?.contact ?? ""}
        address={contact?.address ?? ""}
      />

      {selected ? (
        <CustomerDialog customer={selected} deliveries={deliveriesFor(selected.id)} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function CustomerDialog({
  customer,
  deliveries,
  onClose,
}: {
  customer: DemoCustomer;
  deliveries: Delivery[];
  onClose: () => void;
}) {
  return (
    <SectionCard className="mt-4" title={`${customer.name} · ${customer.code}`} description={customer.address}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <InfoRow label="Barangay">{customer.barangay}</InfoRow>
          <InfoRow label="Customer since">{formatDateNumeric(customer.joinedAt)}</InfoRow>
          <InfoRow label="Latest stop">{deliveries[0]?.ref ?? "None yet"}</InfoRow>
          <InfoRow label="Latest status">{deliveries[0]?.status ?? "—"}</InfoRow>
          <InfoRow label="Payment">{deliveries[0] ? formatCentavos(deliveries[0].amountCentavos) : "—"}</InfoRow>
          <p className="mt-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">{customer.notes}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned deliveries</p>
          <ul className="space-y-1.5">
            {deliveries.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2 text-xs">
                <span>
                  <span className="block font-semibold">{row.ref}</span>
                  <span className="text-muted-foreground">{formatDateNumeric(row.updatedAt)} · {row.jugs} gal</span>
                </span>
                <StatusPill status={row.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Link to="/dispatch">
          <Button variant="outline" size="sm">
            <UsersIcon className="size-3.5" /> Back to route
          </Button>
        </Link>
        <Button size="sm" onClick={onClose}>Close</Button>
      </div>
    </SectionCard>
  );
}
