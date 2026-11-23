import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { SearchIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { selectCustomerOrders } from "../../selectors";
import { OrderDetailDialog } from "../../components/dialogs";
import { PageHeading, SectionCard, StatusPill } from "../../components/ui";
import type { Order } from "../../types";

const filters = [
  "All",
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for delivery",
  "Completed",
  "Cancelled",
  "Failed delivery",
] as const;

export function CustomerHistory() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const orders = selectCustomerOrders(state);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "All" || order.status === filter;
      const matchesQuery =
        !term ||
        order.ref.toLowerCase().includes(term) ||
        order.scheduledDate.includes(term) ||
        order.status.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [orders, filter, query]);

  const onCancel = (order: Order) => {
    state.cancelOrder(order.id);
    toast(`Order ${order.ref} cancelled`, "success");
  };

  return (
    <>
      <PageHeading
        eyebrow="Order history"
        title="Every order in one place"
        subtitle="Open any order for its timeline. Pending orders can be cancelled free of charge."
        actions={
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search orders by reference or date"
              className="w-56 pl-7"
              placeholder="Search reference or date"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        }
      />

      <div className="ws-filter mb-4">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            className={cn("btn-reset ws-chip", filter === item && "is-on")}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
            <span className="text-[0.625rem] opacity-70">
              {item === "All" ? orders.length : orders.filter((order) => order.status === item).length}
            </span>
          </button>
        ))}
      </div>

      <SectionCard bodyClassName="p-0">
        {visible.length === 0 ? (
          <EmptyState
            title="No orders match this view"
            description="Try a different status filter or clear the search."
            action={
              <Button variant="outline" onClick={() => { setFilter("All"); setQuery(""); }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Placed</th>
                    <th>Scheduled</th>
                    <th>Gallons</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <button type="button" className="btn-reset ws-row-btn" onClick={() => setSelected(order)}>
                          {order.ref}
                        </button>
                      </td>
                      <td className="text-muted-foreground">{formatDateNumeric(order.placedAt)}</td>
                      <td>{formatDateNumeric(order.scheduledDate)}</td>
                      <td>{order.jugs}</td>
                      <td>{formatCentavos(order.amountCentavos)}</td>
                      <td className="text-muted-foreground">{order.payment}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(order)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {visible.map((order) => (
                <li key={order.id} className="p-3">
                  <button type="button" className="btn-reset w-full text-left" onClick={() => setSelected(order)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{order.ref}</span>
                      <StatusPill status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateNumeric(order.scheduledDate)} · {order.jugs} gallons · {formatCentavos(order.amountCentavos)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <OrderDetailDialog
        order={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onCancel={onCancel}
      />
    </>
  );
}
