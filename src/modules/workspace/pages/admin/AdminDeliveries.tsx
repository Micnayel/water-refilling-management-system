import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { ArrowRightIcon, TruckIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { DeliveryDetailDialog } from "../../components/dialogs";
import { EmptyState } from "@/components/ui/states";
import { PageHeading, SectionCard, StatCard } from "../../components/ui";
import type { Delivery, DeliveryStatus } from "../../types";

const columns: Array<{ status: DeliveryStatus; label: string; hint: string }> = [
  { status: "Assigned", label: "Assigned", hint: "Queued for a rider" },
  { status: "Preparing", label: "Preparing", hint: "Loading at the depot" },
  { status: "Out for delivery", label: "Out for delivery", hint: "On the road" },
  { status: "Delivered", label: "Delivered", hint: "Completed stops" },
  { status: "Failed delivery", label: "Failed", hint: "Needs a retry" },
];

const advanceLabel: Partial<Record<DeliveryStatus, string>> = {
  Assigned: "Start preparing",
  Preparing: "Dispatch",
  "Out for delivery": "Confirm delivered",
};

export function AdminDeliveries() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const [rider, setRider] = useState("All");
  const [selected, setSelected] = useState<Delivery | null>(null);

  const riders = useMemo(() => ["All", ...Array.from(new Set(state.deliveries.map((row) => row.rider)))], [state.deliveries]);
  const visible = state.deliveries.filter((row) => rider === "All" || row.rider === rider);
  const active = visible.filter((row) => row.status === "Assigned" || row.status === "Preparing" || row.status === "Out for delivery");

  const advance = (delivery: Delivery, status: DeliveryStatus) => {
    state.updateDeliveryStatus(delivery.id, status, "Updated from delivery management.");
    toast(`${delivery.ref} marked ${status.toLowerCase()}`, "success");
    setSelected(null);
  };

  return (
    <>
      <PageHeading
        eyebrow="Delivery management"
        title="Dispatch board"
        subtitle="Move each stop through preparation, dispatch, and completion. Failed stops return stock to the depot."
        actions={
          <div className="ws-filter">
            {riders.map((name) => (
              <button key={name} type="button" className={cn("btn-reset ws-chip", rider === name && "is-on")} aria-pressed={rider === name} onClick={() => setRider(name)}>
                {name === "All" ? "All riders" : name}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Stops today" value={String(visible.length)} icon={TruckIcon} tone="primary" hint={`${active.length} active`} />
        <StatCard label="Out for delivery" value={String(visible.filter((row) => row.status === "Out for delivery").length)} icon={TruckIcon} tone="warning" hint="On the road" />
        <StatCard label="Delivered" value={String(visible.filter((row) => row.status === "Delivered").length)} icon={TruckIcon} tone="success" hint="Completed" />
        <StatCard label="Failed" value={String(visible.filter((row) => row.status === "Failed delivery").length)} icon={TruckIcon} tone="warning" hint="Retry required" />
      </div>

      {visible.length === 0 ? (
        <SectionCard><EmptyState title="No deliveries for this rider" description="Choose another rider or use All riders." /></SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {columns.map((column) => {
            const rows = visible.filter((row) => row.status === column.status);
            return (
              <section key={column.status} className="ws-card flex flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
                  <div>
                    <h2 className="text-xs font-semibold">{column.label}</h2>
                    <p className="text-[0.625rem] text-muted-foreground">{column.hint}</p>
                  </div>
                  <span className="ws-chip">{rows.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {rows.length === 0 ? (
                    <p className="px-1 py-4 text-center text-[0.6875rem] text-muted-foreground">Nothing here.</p>
                  ) : (
                    rows.map((row) => (
                      <article key={row.id} className="rounded-lg border border-border bg-card p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" className="btn-reset ws-row-btn text-xs" onClick={() => setSelected(row)}>
                            {row.ref}
                          </button>
                          <span className="text-[0.625rem] text-muted-foreground">#{row.sequence}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium">{row.customerName}</p>
                        <p className="truncate text-[0.6875rem] text-muted-foreground">{row.area} · {row.jugs} gal</p>
                        <p className="truncate text-[0.6875rem] text-muted-foreground">{row.rider}</p>
                        <p className="mt-1 text-[0.6875rem] text-muted-foreground">{formatDateNumeric(row.updatedAt)} · {formatCentavos(row.amountCentavos)}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {advanceLabel[row.status] ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                advance(
                                  row,
                                  row.status === "Assigned" ? "Preparing" : row.status === "Preparing" ? "Out for delivery" : "Delivered",
                                )
                              }
                            >
                              {advanceLabel[row.status]} <ArrowRightIcon />
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => setSelected(row)}>View</Button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-xs text-muted-foreground">
        Status changes here also update the linked order, payment record, and notifications.
      </div>

      <DeliveryDetailDialog
        delivery={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onAdvance={advance}
      />
    </>
  );
}
