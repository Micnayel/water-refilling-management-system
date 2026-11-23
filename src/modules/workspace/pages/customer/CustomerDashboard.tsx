import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClipboardIcon,
  DropletIcon,
  MapPinIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { formatDateNumeric, formatDateTime } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { useWorkspaceStore } from "../../store";
import {
  customerMetrics,
  notificationsFor,
  planFor,
  selectActiveDelivery,
  selectCustomerOrders,
  selectCustomerTransactions,
} from "../../selectors";
import { OrderDetailDialog } from "../../components/dialogs";
import { TrackingPanel } from "../../components/TrackingPanel";
import { NotificationIcon, SectionCard, StatCard, StatusPill } from "../../components/ui";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { Order } from "../../types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function CustomerDashboard() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const metrics = customerMetrics(state);
  const orders = selectCustomerOrders(state).slice(0, 5);
  const transactions = selectCustomerTransactions(state).slice(0, 4);
  const delivery = selectActiveDelivery(state);
  const plan = planFor(state, metrics.activeSubscription?.planId);
  const notices = notificationsFor(state, "customer").slice(0, 3);
  const [selected, setSelected] = useState<Order | null>(null);

  const onCancel = (order: Order) => {
    state.cancelOrder(order.id);
    toast(`Order ${order.ref} cancelled`, "success");
  };

  return (
    <>
      <section className="ws-hero mb-4">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="ws-eyebrow">Customer dashboard</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              {greeting()}, {state.customers[0]?.name.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1 text-sm">
              {metrics.activeSubscription
                ? `Your ${plan?.name ?? "subscription"} is active. Next delivery ${formatDateNumeric(metrics.activeSubscription.nextDate)} · ${metrics.activeSubscription.window}.`
                : "You have no active subscription. Start one to automate your weekly water delivery."}
            </p>
            <div className="ws-hero-meta mt-3">
              <span className="ws-hero-chip">
                <DropletIcon className="size-3.5" /> {plan?.name ?? "No plan"}
              </span>
              <span className="ws-hero-chip">
                <CalendarIcon className="size-3.5" /> {metrics.activeSubscription?.deliveriesThisMonth ?? 0} deliveries this month
              </span>
              <span className="ws-hero-chip">
                <TruckIcon className="size-3.5" /> {metrics.pendingOrders} open orders
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/order" className="ws-hero-btn">
              <DropletIcon className="size-4" /> Quick order
            </Link>
            <Link to="/portal/tracking" className="ws-hero-ghost">
              <MapPinIcon className="size-4" /> Track delivery
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Active subscription"
          value={plan?.name ?? "None"}
          icon={CalendarIcon}
          tone="primary"
          hint={metrics.activeSubscription?.status === "paused" ? "Paused" : "Auto-delivery on"}
        />
        <StatCard
          label="Upcoming delivery"
          value={formatDateNumeric(metrics.activeSubscription?.nextDate)}
          icon={TruckIcon}
          hint={metrics.activeSubscription?.window ?? "No window yet"}
        />
        <StatCard label="Total orders" value={String(metrics.totalOrders)} icon={ClipboardIcon} hint={`${metrics.completedOrders} completed`} />
        <StatCard label="Pending orders" value={String(metrics.pendingOrders)} icon={DropletIcon} tone="warning" hint="Awaiting delivery" />
        <StatCard
          label="Recent transactions"
          value={transactions[0] ? formatCentavos(transactions[0].amountCentavos) : "—"}
          icon={WalletIcon}
          tone="success"
          hint={transactions[0] ? `${transactions[0].status} · ${transactions[0].method}` : "No payments yet"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <SectionCard
            title="Recent order activity"
            description="Every order opens its full details and delivery timeline."
            action={
              <Link to="/portal/history" className="ws-link text-xs">
                View all
              </Link>
            }
            bodyClassName="p-0"
          >
            <div className="hidden overflow-x-auto md:block">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Scheduled</th>
                    <th>Gallons</th>
                    <th>Amount</th>
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
                      <td className="text-muted-foreground">{formatDateNumeric(order.scheduledDate)}</td>
                      <td>{order.jugs}</td>
                      <td>{formatCentavos(order.amountCentavos)}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(order)}>
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    className="btn-reset flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                    onClick={() => setSelected(order)}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{order.ref}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDateNumeric(order.scheduledDate)} · {order.jugs} gal
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusPill status={order.status} />
                      <ArrowRightIcon className="size-4 text-muted-foreground" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard
              title="Your subscription"
              description={plan?.description ?? "No active plan"}
              action={
                <Link to="/portal/subscription" className="ws-link text-xs">
                  Manage
                </Link>
              }
            >
              {metrics.activeSubscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold">{plan?.name}</span>
                    <StatusPill status={metrics.activeSubscription.status === "active" ? "Active" : "Paused"} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan?.jugs} gallons · {plan?.cadence.toLowerCase()} · {formatCentavos(plan?.priceCentavos ?? 0)} per delivery
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-2">
                      <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Next delivery</p>
                      <p className="text-sm font-semibold">{formatDateNumeric(metrics.activeSubscription.nextDate)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-2">
                      <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Window</p>
                      <p className="text-sm font-semibold">{metrics.activeSubscription.window}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { state.skipNextDelivery(); toast("Next delivery moved by one week", "success"); }}>
                      Skip next
                    </Button>
                    <Button size="sm" onClick={() => { state.setSubscriptionStatus(metrics.activeSubscription?.status === "active" ? "paused" : "active"); toast(metrics.activeSubscription?.status === "active" ? "Subscription paused" : "Subscription resumed", "success"); }}>
                      {metrics.activeSubscription.status === "active" ? "Pause" : "Resume"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Choose a plan to schedule recurring deliveries.</p>
              )}
            </SectionCard>

            <SectionCard title="Recent transactions" description="Payments collected on delivery." bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {transactions.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{row.orderRef}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        {formatDateNumeric(row.date)} · {row.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCentavos(row.amountCentavos)}</p>
                      <Badge tone={row.status === "Paid" ? "success" : "warning"}>{row.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SectionCard
            title="Delivery tracking preview"
            description="Simulated route for the active delivery. Synthetic addresses only."
            action={
              <Link to="/portal/tracking" className="ws-link text-xs">
                Open tracking
              </Link>
            }
          >
            <TrackingPanel delivery={delivery} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Quick order" description="Start a one-time delivery.">
            <div className="grid gap-2">
              <Link to="/portal/order" className="ws-quick">
                <span className="ws-quick-icon">
                  <DropletIcon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Order water now</span>
                  <span className="block text-xs text-muted-foreground">Pick a date, window, and payment method.</span>
                </span>
              </Link>
              <Link to="/portal/subscription" className="ws-quick">
                <span className="ws-quick-icon">
                  <CalendarIcon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Adjust my subscription</span>
                  <span className="block text-xs text-muted-foreground">Change plan, pause, or skip a week.</span>
                </span>
              </Link>
              <Link to="/portal/tracking" className="ws-quick">
                <span className="ws-quick-icon">
                  <TruckIcon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Track my rider</span>
                  <span className="block text-xs text-muted-foreground">See ETA, stop status, and route.</span>
                </span>
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="Notifications"
            description={`${metrics.unread} unread`}
            action={
              <Link to="/portal/notifications" className="ws-link text-xs">
                All
              </Link>
            }
            bodyClassName="p-2"
          >
            <ul className="space-y-1.5">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    to={notice.href ?? "/portal/notifications"}
                    className={cn("ws-notice items-start", !notice.read && "is-unread")}
                  >
                    <NotificationIcon kind={notice.kind} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{notice.title}</span>
                      <span className="block text-[0.6875rem] text-muted-foreground">
                        {formatDateTime(notice.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <OrderDetailDialog
        order={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onCancel={onCancel}
      />
    </>
  );
}
