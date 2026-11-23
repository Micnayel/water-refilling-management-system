import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { ClipboardIcon, DropletIcon, SearchIcon } from "@/components/ui/icons";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { OrderDetailDialog } from "../../components/dialogs";
import { PageHeading, SectionCard, StatCard, StatusPill } from "../../components/ui";
import type { Order, OrderStatus } from "../../types";

const statuses: Array<OrderStatus | "All"> = [
  "All",
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for delivery",
  "Completed",
  "Cancelled",
  "Failed delivery",
];

export function AdminOrders() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof statuses)[number]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const orders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...state.orders]
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
      .filter((order) => {
        const matchesFilter = filter === "All" || order.status === filter;
        const matchesQuery =
          !term ||
          order.ref.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          order.area.toLowerCase().includes(term);
        return matchesFilter && matchesQuery;
      });
  }, [state.orders, filter, query]);

  const pending = state.orders.filter((row) => row.status === "Pending");
  const inFlight = state.orders.filter((row) => row.status === "Out for delivery");
  const revenue = state.orders
    .filter((row) => row.status === "Completed")
    .reduce((total, row) => total + row.amountCentavos, 0);
  const gallons = state.orders
    .filter((row) => row.status !== "Cancelled")
    .reduce((total, row) => total + row.jugs, 0);

  const confirm = (order: Order) => {
    state.confirmOrder(order.id);
    toast(`${order.ref} confirmed and stock reserved`, "success");
    setSelected(null);
  };

  const cancel = (order: Order) => {
    state.cancelOrder(order.id);
    toast(`${order.ref} cancelled`, "success");
    setSelected(null);
  };

  return (
    <>
      <PageHeading
        eyebrow="Order management"
        title="All customer orders"
        subtitle="Confirm pending orders, release stock, and follow each order to completion."
        actions={
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search orders" className="w-60 pl-7" placeholder="Reference, customer, or area" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(state.orders.length)} icon={ClipboardIcon} tone="primary" hint="Synthetic dataset" />
        <StatCard label="Pending" value={String(pending.length)} icon={ClipboardIcon} tone="warning" hint="Need confirmation" />
        <StatCard label="Out for delivery" value={String(inFlight.length)} icon={DropletIcon} hint="On the road" />
        <StatCard label="Completed revenue" value={formatCentavos(revenue)} icon={ClipboardIcon} tone="success" hint={`${gallons} gallons sold`} />
      </div>

      <div className="ws-filter mb-3">
        {statuses.map((item) => (
          <button
            key={item}
            type="button"
            className={cn("btn-reset ws-chip", filter === item && "is-on")}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
            <span className="text-[0.625rem] opacity-70">
              {item === "All" ? state.orders.length : state.orders.filter((order) => order.status === item).length}
            </span>
          </button>
        ))}
      </div>

      <SectionCard bodyClassName="p-0">
        {orders.length === 0 ? (
          <EmptyState title="No orders match" description="Change the status filter or clear the search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Area</th>
                  <th>Scheduled</th>
                  <th>Gallons</th>
                  <th>Amount</th>
                  <th>Rider</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button type="button" className="btn-reset ws-row-btn" onClick={() => setSelected(order)}>
                        {order.ref}
                      </button>
                    </td>
                    <td>{order.customerName}</td>
                    <td className="text-muted-foreground">{order.area}</td>
                    <td className="text-muted-foreground">{formatDateNumeric(order.scheduledDate)}</td>
                    <td>{order.jugs}</td>
                    <td>{formatCentavos(order.amountCentavos)}</td>
                    <td className="text-muted-foreground">{order.riderName}</td>
                    <td><StatusPill status={order.status} /></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {order.status === "Pending" ? (
                          <Button size="sm" variant="outline" onClick={() => confirm(order)}>
                            Confirm
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => setSelected(order)}>
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <OrderDetailDialog
        order={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onCancel={cancel}
      />
    </>
  );
}
