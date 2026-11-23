import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { SearchIcon, TruckIcon, WalletIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { selectRiderHistory } from "../../store";
import { DeliveryDetailDialog } from "../../components/dialogs";
import { PageHeading, SectionCard, StatCard, StatusPill } from "../../components/ui";
import type { Delivery } from "../../types";

const filters = ["All", "Delivered", "Failed delivery"] as const;

export function RiderHistory() {
  const state = useWorkspaceStore();
  const history = selectRiderHistory(state);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Delivery | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return history.filter((row) => {
      const matchesFilter = filter === "All" || row.status === filter;
      const matchesQuery = !term || row.ref.toLowerCase().includes(term) || row.customerName.toLowerCase().includes(term) || row.area.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [history, filter, query]);

  const delivered = history.filter((row) => row.status === "Delivered");
  const failed = history.filter((row) => row.status === "Failed delivery");
  const collected = delivered.reduce((total, row) => total + row.amountCentavos, 0);
  const gallons = delivered.reduce((total, row) => total + row.jugs, 0);

  return (
    <>
      <PageHeading
        eyebrow="Delivery history"
        title="Completed and failed stops"
        subtitle="A record of what you delivered, what was collected, and why a stop failed."
        actions={
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search deliveries" className="w-56 pl-7" placeholder="Reference, customer, or area" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Delivered" value={String(delivered.length)} icon={TruckIcon} tone="success" hint="All time" />
        <StatCard label="Failed" value={String(failed.length)} icon={TruckIcon} tone="warning" hint="Returned to depot" />
        <StatCard label="Cash collected" value={formatCentavos(collected)} icon={WalletIcon} tone="primary" hint="Delivered stops" />
        <StatCard label="Gallons delivered" value={String(gallons)} icon={TruckIcon} hint="All time" />
      </div>

      <div className="ws-filter mb-3">
        {filters.map((item) => (
          <button key={item} type="button" className={cn("btn-reset ws-chip", filter === item && "is-on")} aria-pressed={filter === item} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>

      <SectionCard bodyClassName="p-0">
        {visible.length === 0 ? (
          <EmptyState title="No matching deliveries" description="Change the filter or clear the search to see more stops." />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((row) => (
              <li key={row.id}>
                <button type="button" className="btn-reset flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40" onClick={() => setSelected(row)}>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{row.ref} · {row.customerName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{row.address}</span>
                    <span className="block text-[0.6875rem] text-muted-foreground">
                      {formatDateNumeric(row.updatedAt)} · {row.jugs} gallons · {formatCentavos(row.amountCentavos)}
                    </span>
                  </span>
                  <StatusPill status={row.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={() => { setFilter("All"); setQuery(""); }}>
          Reset filters
        </Button>
      </div>

      <DeliveryDetailDialog delivery={selected} open={selected !== null} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
