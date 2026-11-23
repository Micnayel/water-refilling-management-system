import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  NavigationIcon,
  PackageIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { formatCentavos } from "@/lib/money";
import { useWorkspaceStore } from "../../store";
import { selectRiderDeliveries } from "../../store";
import { ContactDialog, DeliveryDetailDialog } from "../../components/dialogs";
import { TrackingPanel } from "../../components/TrackingPanel";
import { EmptyState } from "@/components/ui/states";
import { DemoNotice, PageHeading, SectionCard, StatCard, StatusPill } from "../../components/ui";
import type { Delivery, DeliveryStatus } from "../../types";

const nextAction: Partial<Record<DeliveryStatus, { label: string; status: DeliveryStatus }>> = {
  Assigned: { label: "Start preparing", status: "Preparing" },
  Preparing: { label: "Mark out for delivery", status: "Out for delivery" },
  "Out for delivery": { label: "Confirm delivery", status: "Delivered" },
};

export function RiderDeliveries() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const stops = selectRiderDeliveries(state);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [contact, setContact] = useState<Delivery | null>(null);

  const codTotal = stops.reduce((total, row) => total + (row.amountCentavos > 0 ? row.amountCentavos : 0), 0);
  const nextStop = stops[0];

  const advance = (delivery: Delivery, status: DeliveryStatus) => {
    state.updateDeliveryStatus(delivery.id, status, `Updated by ${state.rider.name}.`);
    toast(`${delivery.ref} marked ${status.toLowerCase()}`, "success");
    setSelected(null);
  };

  return (
    <>
      <PageHeading
        eyebrow="My deliveries"
        title="Today's route"
        subtitle={`${state.rider.zone} · ${state.rider.shift}`}
        actions={
          <Button
            variant={state.rider.status === "On duty" ? "outline" : "default"}
            onClick={() => {
              const next = state.rider.status === "On duty" ? "Off duty" : "On duty";
              state.updateRiderProfile({ status: next });
              toast(`You are now ${next.toLowerCase()}`, "success");
            }}
          >
            {state.rider.status === "On duty" ? "Go off duty" : "Go on duty"}
          </Button>
        }
      />

      <DemoNotice>
        Route, addresses, and contact numbers are synthetic preview data. Contact reveals stay in this browser
        and are not audited.
      </DemoNotice>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Stops left" value={String(stops.length)} icon={TruckIcon} tone="primary" hint="North route" />
        <StatCard
          label="Gallons to load"
          value={String(stops.reduce((total, row) => total + row.jugs, 0))}
          icon={PackageIcon}
          hint="Check before leaving"
        />
        <StatCard
          label="Cash to collect"
          value={formatCentavos(codTotal)}
          icon={WalletIcon}
          tone="success"
          hint="COD totals only"
        />
        <StatCard
          label="Duty status"
          value={state.rider.status}
          icon={CheckIcon}
          tone="warning"
          hint={state.rider.vehicle}
        />
      </div>

      {stops.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No deliveries left today"
            description="Completed stops move to Delivery History. New assignments appear here automatically."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {nextStop ? (
              <article className="ws-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-primary/5 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <NavigationIcon className="size-4" /> Next stop · #{nextStop.sequence}
                  </span>
                  <StatusPill status={nextStop.status} />
                </div>
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-lg font-bold tracking-tight">{nextStop.customerName}</p>
                    <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                      {nextStop.address}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {nextStop.window} · {nextStop.jugs} gallons · {formatCentavos(nextStop.amountCentavos)}
                    </p>
                    {nextStop.note ? (
                      <p className="mt-2 rounded-lg bg-muted/50 p-2 text-xs">
                        <span className="font-semibold">Note: </span>
                        {nextStop.note}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setContact(nextStop)}>
                        Contact customer
                      </Button>
                      {nextAction[nextStop.status] ? (
                        <Button size="sm" onClick={() => advance(nextStop, nextAction[nextStop.status]!.status)}>
                          {nextAction[nextStop.status]!.label} <ArrowRightIcon />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <TrackingPanel delivery={nextStop} />
                </div>
              </article>
            ) : null}

            <SectionCard title="All stops" description="Ordered by route sequence." bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {stops.map((stop) => (
                  <li key={stop.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" className="btn-reset flex min-w-0 w-full flex-1 items-center gap-3 text-left" onClick={() => setSelected(stop)}>
                      <span className="ws-stat-icon is-primary size-9 shrink-0 font-semibold">{stop.sequence}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{stop.customerName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{stop.address}</span>
                        <span className="block text-[0.6875rem] text-muted-foreground">
                          {stop.window} · {stop.jugs} gal · {formatCentavos(stop.amountCentavos)}
                        </span>
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusPill status={stop.status} />
                      {nextAction[stop.status] ? (
                        <Button variant="ghost" size="sm" onClick={() => advance(stop, nextAction[stop.status]!.status)}>
                          {nextAction[stop.status]!.label}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Route progress">
              <ol className="space-y-2">
                {stops.map((stop) => (
                  <li key={stop.id} className="flex items-center gap-2 text-sm">
                    <span className={`ws-status tone-${stop.status === "Out for delivery" ? "warning" : stop.status === "Preparing" ? "primary" : "muted"}`}>
                      {stop.sequence}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{stop.area}</span>
                    <span className="text-xs text-muted-foreground">{stop.etaMinutes > 0 ? `${stop.etaMinutes} min` : "Done"}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>

            <SectionCard title="Before you leave" description="Daily checklist">
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" /> Confirm loaded gallons against the stop list.</li>
                <li className="flex gap-2"><CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" /> Collect cash only for COD stops and record it before closing the stop.</li>
                <li className="flex gap-2"><CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" /> Mark a failed delivery so stock returns to the depot.</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      )}

      <DeliveryDetailDialog
        delivery={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onAdvance={advance}
        onRevealContact={(delivery) => {
          setSelected(null);
          setContact(delivery);
        }}
      />

      <ContactDialog
        open={contact !== null}
        onOpenChange={(open) => !open && setContact(null)}
        name={contact?.customerName ?? ""}
        contact={contact?.contact ?? ""}
        address={contact?.address ?? ""}
      />
    </>
  );
}
