import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { MapPinIcon, TruckIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { TrackingPanel } from "../../components/TrackingPanel";
import { DeliveryDetailDialog } from "../../components/dialogs";
import { DemoNotice, InfoRow, PageHeading, SectionCard, StatusPill } from "../../components/ui";
import type { Delivery } from "../../types";

const filters = ["Active", "All"] as const;

export function AdminTracking() {
  const state = useWorkspaceStore();
  const [filter, setFilter] = useState<(typeof filters)[number]>("Active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Delivery | null>(null);

  const rows = useMemo(() => {
    const sorted = [...state.deliveries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (filter === "All") return sorted;
    return sorted.filter((row) => row.status !== "Delivered" && row.status !== "Failed delivery");
  }, [state.deliveries, filter]);

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  return (
    <>
      <PageHeading
        eyebrow="Delivery tracking"
        title="Fleet visibility"
        subtitle="Inspect any stop's simulated route, rider, and status history."
        actions={
          <div className="ws-filter">
            {filters.map((item) => (
              <button key={item} type="button" className={cn("btn-reset ws-chip", filter === item && "is-on")} aria-pressed={filter === item} onClick={() => setFilter(item)}>
                {item} stops
              </button>
            ))}
          </div>
        }
      />

      <DemoNotice>
        Routes here are simulated from synthetic delivery records. They are not live GPS and contain no real
        customer coordinates.
      </DemoNotice>

      {rows.length === 0 ? (
        <SectionCard>
          <EmptyState title="No stops to show" description="Switch to All stops or wait for the next dispatch." />
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SectionCard
            title={selected ? `${selected.ref} · ${selected.customerName}` : "Tracking"}
            description={selected ? `${selected.address} · ${selected.window}` : undefined}
            action={selected ? <StatusPill status={selected.status} /> : null}
          >
            {selected ? (
              <>
                <TrackingPanel delivery={selected} />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <InfoRow label="Rider">{selected.rider}</InfoRow>
                    <InfoRow label="Stop">{`#${selected.sequence} · ${selected.area}`}</InfoRow>
                    <InfoRow label="Gallons">{selected.jugs}</InfoRow>
                    <InfoRow label="Amount">{formatCentavos(selected.amountCentavos)}</InfoRow>
                  </div>
                  <div>
                    <InfoRow label="Window">{selected.window}</InfoRow>
                    <InfoRow label="Distance">{`${selected.distanceKm.toFixed(1)} km`}</InfoRow>
                    <InfoRow label="ETA">{selected.etaMinutes > 0 ? `${selected.etaMinutes} min` : "Finished"}</InfoRow>
                    <InfoRow label="Last update">{formatDateNumeric(selected.updatedAt)}</InfoRow>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setDetail(selected)}>
                    Full activity
                  </Button>
                </div>
              </>
            ) : null}
          </SectionCard>

          <SectionCard title="Stops" description="Select a stop to map it." bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cn(
                      "btn-reset flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                      selected?.id === row.id && "bg-primary/5",
                    )}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <span className="btn-reset flex min-w-0 items-center gap-2">
                      <span className="ws-stat-icon is-primary size-8 shrink-0">
                        {row.status === "Out for delivery" ? <TruckIcon className="size-4" /> : <MapPinIcon className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{row.customerName}</span>
                        <span className="block truncate text-[0.6875rem] text-muted-foreground">
                          {row.ref} · {row.rider} · {row.area}
                        </span>
                      </span>
                    </span>
                    <StatusPill status={row.status} />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      <DeliveryDetailDialog delivery={detail} open={detail !== null} onOpenChange={(open) => !open && setDetail(null)} />
    </>
  );
}
