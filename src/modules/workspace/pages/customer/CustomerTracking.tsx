import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { MapPinIcon, TruckIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { DEMO_CUSTOMER_ID } from "../../data";
import { selectActiveDelivery } from "../../selectors";
import { TrackingPanel } from "../../components/TrackingPanel";
import { DeliveryDetailDialog } from "../../components/dialogs";
import { DemoNotice, PageHeading, SectionCard, StatusPill } from "../../components/ui";
import type { Delivery } from "../../types";

export function CustomerTracking() {
  const state = useWorkspaceStore();
  const active = selectActiveDelivery(state);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Delivery | null>(null);

  const history = state.deliveries
    .filter((row) => row.customerId === DEMO_CUSTOMER_ID)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const selected = history.find((row) => row.id === selectedId) ?? active;

  return (
    <>
      <PageHeading
        eyebrow="Delivery tracking"
        title="Where is my water?"
        subtitle="Follow the active delivery from the depot to your door."
        actions={
          <Link to="/portal/order" className="ws-chip">
            <MapPinIcon className="size-3.5" /> New order
          </Link>
        }
      />

      <DemoNotice>
        Tracking uses a simulated route drawn from synthetic records. It is not live GPS and never shows real
        coordinates or customer names on the map.
      </DemoNotice>

      {!selected ? (
        <SectionCard>
          <EmptyState
            title="No delivery to track"
            description="Once an order is assigned to a rider, its route and status will appear here."
            action={
              <Link to="/portal/order">
                <Button>Place an order</Button>
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <SectionCard
            title={`Tracking ${selected.ref}`}
            description={`${selected.jugs} gallons · ${selected.window}`}
            action={<StatusPill status={selected.status} />}
          >
            <TrackingPanel delivery={selected} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setDetail(selected)}>
                Delivery details
              </Button>
              <Link to="/portal/history">
                <Button variant="ghost">Order history</Button>
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Delivery activity" description="Most recent first." bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {history.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cn(
                      "btn-reset flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                      row.id === selected.id && "bg-primary/5",
                    )}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <span className="btn-reset flex min-w-0 items-center gap-2">
                      <span className="ws-stat-icon is-primary size-8 shrink-0">
                        <TruckIcon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{row.ref}</span>
                        <span className="block text-[0.6875rem] text-muted-foreground">
                          {formatDateNumeric(row.updatedAt)} · {row.area}
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
