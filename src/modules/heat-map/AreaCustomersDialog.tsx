import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric } from "@/lib/dates";
import { usePermission } from "@/hooks/use-permission";
import { queryCustomers, type MaskedCustomer } from "@/modules/customers";

export interface AreaCustomersDialogProps {
  area: string | null;
  cellCount: number;
  onOpenChange: (open: boolean) => void;
}

async function loadAreaCustomers(area: string): Promise<MaskedCustomer[]> {
  const items: MaskedCustomer[] = [];
  let cursor: string | undefined;
  // Areas can hold more than one page; walk them so the list is complete.
  for (let page = 0; page < 10; page += 1) {
    const result = await queryCustomers({ cursor, pageSize: 100, barangay: area });
    items.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return items;
}

/**
 * The Heat Map API only returns aggregates. Listing the people behind an area
 * reads the Customers module instead, so it needs that module's `view` grant.
 */
export function AreaCustomersDialog({ area, cellCount, onOpenChange }: AreaCustomersDialogProps) {
  const canViewCustomers = usePermission("customers:view");
  const query = useQuery({
    queryKey: ["heat-map", "area-customers", area],
    queryFn: () => loadAreaCustomers(area as string),
    enabled: area !== null && canViewCustomers,
  });

  const items = query.data ?? [];
  const countLabel = query.isLoading
    ? "Loading customers…"
    : `${items.length} ${items.length === 1 ? "customer" : "customers"} in this area`;

  return (
    <Dialog
      open={area !== null}
      onOpenChange={onOpenChange}
      title={area ? `Customers in ${area}` : "Customers"}
      description={
        area
          ? `${countLabel} · ${cellCount} counted in the current heat map view`
          : undefined
      }
      size="wide"
      footer={<Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>}
    >
      {!canViewCustomers ? (
        <Alert tone="warning">
          Listing customer records needs the <span className="font-semibold">customers:view</span>{" "}
          grant. The aggregated heat map remains available.
        </Alert>
      ) : query.isLoading ? (
        <SkeletonRows rows={6} />
      ) : query.isError ? (
        <ErrorState
          description={apiMessage(query.error)}
          action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No customers in this area"
          description="No customer record currently uses this barangay. Adjust the area filter or add a customer in the Customers module."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((customer) => (
            <li key={customer.id} className="rounded-xl border border-border/70 bg-muted/20 p-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.code} · {customer.barangay || "No barangay"}
                  </p>
                </div>
                <Badge tone={statusTone(customer.status)} className="shrink-0 capitalize">
                  {customer.status}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Address</dt>
                  <dd className="mt-0.5 truncate font-medium">{customer.address || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Gallons on hand</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{customer.gallonsOnHand}</dd>
                </div>
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Registered</dt>
                  <dd className="mt-0.5 font-medium">{formatDateNumeric(customer.createdAt)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Heat map responses stay aggregated. These records come from the Customers module and keep its
        masking and permission rules.
      </p>
    </Dialog>
  );
}
