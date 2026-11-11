import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DirectionsMap } from "@/components/maps";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric } from "@/lib/dates";
import { isPreviewMode } from "@/lib/preview";
import { stationLocation } from "@/config/brand";
import { usePermission } from "@/hooks/use-permission";
import { getCustomer, queryCustomers, type MaskedCustomer } from "@/modules/customers";

export interface AreaCustomersDialogProps {
  open: boolean;
  /** `null` lists every customer instead of a single barangay. */
  area: string | null;
  /** Counted cells from the current heat map view, when an area is selected. */
  cellCount?: number;
  onOpenChange: (open: boolean) => void;
}

interface RouteTarget {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

async function loadCustomers(area: string | null): Promise<MaskedCustomer[]> {
  const items: MaskedCustomer[] = [];
  let cursor: string | undefined;
  // The list can span several pages; walk them so the dialog is complete.
  for (let page = 0; page < 10; page += 1) {
    const result = await queryCustomers({
      cursor,
      pageSize: 100,
      barangay: area ?? undefined,
    });
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
export function AreaCustomersDialog({ open, area, cellCount, onOpenChange }: AreaCustomersDialogProps) {
  const canViewCustomers = usePermission("customers:view");
  const [target, setTarget] = useState<RouteTarget | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["heat-map", "area-customers", area ?? "all"],
    queryFn: () => loadCustomers(area),
    enabled: open && canViewCustomers,
  });

  // A different area (or a closed dialog) always starts from the list again.
  useEffect(() => {
    if (!open) {
      setTarget(null);
      setRouteError(null);
    }
  }, [open, area]);

  /**
   * The list response carries masked rows, so read the detail endpoint for the
   * generalized area center before drawing a route. The exact location is
   * never requested here.
   */
  const openDirections = async (customer: MaskedCustomer) => {
    setRouteError(null);
    setPendingId(customer.id);
    try {
      const detail = await getCustomer(customer.id);
      if (detail.areaLatitude === null || detail.areaLongitude === null) {
        setRouteError("No map location is on file for this customer yet.");
        return;
      }
      setTarget({
        id: detail.id,
        label: detail.name,
        address: detail.address || detail.barangay,
        latitude: detail.areaLatitude,
        longitude: detail.areaLongitude,
      });
    } catch (error) {
      setRouteError(apiMessage(error));
    } finally {
      setPendingId(null);
    }
  };

  const items = query.data ?? [];
  const countLabel = query.isLoading
    ? "Loading customers…"
    : `${items.length} ${items.length === 1 ? "customer" : "customers"}`;
  const title = area ? `Customers in ${area}` : "All customer records";
  const description = area
    ? `${countLabel} in this area${typeof cellCount === "number" ? ` · ${cellCount} counted in the current heat map view` : ""}`
    : `${countLabel} across every area${isPreviewMode() ? " (synthetic preview records)" : ""}`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="wide"
      footer={
        target ? (
          <Button variant="outline" onClick={() => setTarget(null)}>
            Back to list
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        )
      }
    >
      {!canViewCustomers ? (
        <Alert tone="warning">
          Listing customer records needs the <span className="font-semibold">customers:view</span>{" "}
          grant. The aggregated heat map remains available.
        </Alert>
      ) : target ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{target.label}</p>
              <p className="truncate text-xs text-muted-foreground">{target.address}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>
              <ChevronLeftIcon className="size-3.5" /> Customer list
            </Button>
          </div>
          <DirectionsMap
            origin={stationLocation}
            destination={{ latitude: target.latitude, longitude: target.longitude }}
            destinationLabel={target.label}
            height="clamp(16rem, 40vh, 24rem)"
            ariaLabel={`Driving directions to the selected customer in ${area ?? "this area"}`}
          />
          <p className="text-xs text-muted-foreground">
            The destination uses the generalized area center until the exact location is revealed in
            the Customers module. The route is drawn inside the app; no addresses or coordinates are
            placed in the URL.
          </p>
        </div>
      ) : query.isLoading ? (
        <SkeletonRows rows={6} />
      ) : query.isError ? (
        <ErrorState
          description={apiMessage(query.error)}
          action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={area ? "No customers in this area" : "No customer records"}
          description={
            area
              ? "No customer record currently uses this barangay. Adjust the area filter or add a customer in the Customers module."
              : "Add a customer in the Customers module to see records here."
          }
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
                <div className="min-w-0">
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                    Address
                  </dt>
                  <dd className="mt-0.5">
                    <button
                      type="button"
                      className="btn-reset inline-flex max-w-full items-center gap-1 text-left font-medium text-primary underline-offset-4 hover:underline focus-visible:underline disabled:opacity-60"
                      onClick={() => void openDirections(customer)}
                      disabled={pendingId !== null}
                      aria-label={`Show directions to customer ${customer.code}`}
                    >
                      <span className="truncate">{customer.address || "—"}</span>
                      <ChevronRightIcon className="size-3 shrink-0" />
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                    Gallons on hand
                  </dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{customer.gallonsOnHand}</dd>
                </div>
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                    Registered
                  </dt>
                  <dd className="mt-0.5 font-medium">{formatDateNumeric(customer.createdAt)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      {routeError ? (
        <div className="mt-3">
          <Alert tone="warning">{routeError}</Alert>
        </div>
      ) : null}

      {!target ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Heat map responses stay aggregated. These records come from the Customers module and keep
          its masking and permission rules. Select an address to open driving directions.
        </p>
      ) : null}
    </Dialog>
  );
}
