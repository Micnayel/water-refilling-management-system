import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { CalendarIcon, PauseIcon, PlayIcon, SearchIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { planFor } from "../../selectors";
import { InfoRow, PageHeading, SectionCard, StatCard, StatusPill } from "../../components/ui";
import type { Subscription } from "../../types";

const filters = ["All", "active", "paused"] as const;

export function AdminSubscriptions() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Subscription | null>(null);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return state.subscriptions
      .filter((row) => filter === "All" || row.status === filter)
      .filter((row) => !term || row.customerName.toLowerCase().includes(term));
  }, [state.subscriptions, filter, query]);

  const active = state.subscriptions.filter((row) => row.status === "active");
  const paused = state.subscriptions.filter((row) => row.status === "paused");
  const recurringValue = active.reduce((total, row) => total + (planFor(state, row.planId)?.priceCentavos ?? 0), 0);
  const visits = state.subscriptions.reduce((total, row) => total + row.deliveriesThisMonth, 0);

  const toggle = (row: Subscription) => {
    const next = row.status === "active" ? "paused" : "active";
    state.setSubscriptionStatusById(row.id, next);
    toast(`${row.customerName}'s plan ${next === "paused" ? "paused" : "resumed"}`, "success");
    setSelected((current) => (current && current.id === row.id ? { ...current, status: next } : current));
  };

  return (
    <>
      <PageHeading
        eyebrow="Subscription management"
        title="Recurring delivery plans"
        subtitle="Pause or resume any plan. Changes take effect from the next scheduled delivery."
        actions={
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search subscriptions by customer" className="w-56 pl-7" placeholder="Search customer" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active plans" value={String(active.length)} icon={CalendarIcon} tone="success" hint="Auto-delivery on" />
        <StatCard label="Paused plans" value={String(paused.length)} icon={PauseIcon} tone="warning" hint="No visits scheduled" />
        <StatCard label="Recurring value" value={formatCentavos(recurringValue)} icon={CalendarIcon} tone="primary" hint="Per delivery cycle" />
        <StatCard label="Visits this month" value={String(visits)} icon={CalendarIcon} hint="Across all plans" />
      </div>

      <div className="ws-filter mb-3">
        {filters.map((item) => (
          <button key={item} type="button" className={cn("btn-reset ws-chip", filter === item && "is-on")} aria-pressed={filter === item} onClick={() => setFilter(item)}>
            {item === "All" ? "All plans" : item === "active" ? "Active" : "Paused"}
          </button>
        ))}
      </div>

      <SectionCard bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState title="No subscriptions match" description="Change the filter or clear the search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Next delivery</th>
                  <th>Window</th>
                  <th>This month</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const plan = planFor(state, row.planId);
                  return (
                    <tr key={row.id}>
                      <td>
                        <button type="button" className="btn-reset ws-row-btn" onClick={() => setSelected(row)}>
                          {row.customerName}
                        </button>
                      </td>
                      <td>{plan?.name ?? "—"}</td>
                      <td className="text-muted-foreground">{formatDateNumeric(row.nextDate)}</td>
                      <td className="text-muted-foreground">{row.window}</td>
                      <td>{row.deliveriesThisMonth}</td>
                      <td><StatusPill status={row.status === "active" ? "Active" : "Paused"} /></td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(row)}>Details</Button>
                          <Button size="sm" variant="outline" onClick={() => toggle(row)}>
                            {row.status === "active" ? "Pause" : "Resume"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? `${selected.customerName}'s subscription` : "Subscription"}
        description={selected ? planFor(state, selected.planId)?.name : undefined}
        footer={
          selected ? (
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              <Button variant={selected.status === "active" ? "outline" : "default"} onClick={() => toggle(selected)}>
                {selected.status === "active" ? <PauseIcon /> : <PlayIcon />}
                {selected.status === "active" ? "Pause plan" : "Resume plan"}
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div>
            <InfoRow label="Plan">{planFor(state, selected.planId)?.name}</InfoRow>
            <InfoRow label="Gallons per visit">{String(planFor(state, selected.planId)?.jugs ?? "—")}</InfoRow>
            <InfoRow label="Cadence">{planFor(state, selected.planId)?.cadence ?? "—"}</InfoRow>
            <InfoRow label="Price">{formatCentavos(planFor(state, selected.planId)?.priceCentavos ?? 0)}</InfoRow>
            <InfoRow label="Next delivery">{`${formatDateNumeric(selected.nextDate)} · ${selected.window}`}</InfoRow>
            <InfoRow label="Started">{formatDateNumeric(selected.startedAt)}</InfoRow>
            <InfoRow label="Visits this month">{selected.deliveriesThisMonth}</InfoRow>
            <InfoRow label="Status"><StatusPill status={selected.status === "active" ? "Active" : "Paused"} /></InfoRow>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
