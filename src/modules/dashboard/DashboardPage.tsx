import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  ClipboardIcon,
  DropletIcon,
  MapIcon,
  MapPinIcon,
  PackageIcon,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { BaseMap } from "@/components/maps";
import { MaskedValue } from "@/components/privacy/masked-value";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric, formatDateTime, formatTime, todayIso } from "@/lib/dates";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useSessionStore } from "@/stores/session-store";
import { queryCustomers } from "@/modules/customers";
import { useNotifications } from "@/modules/notifications";
import { BarChart } from "./components/BarChart";
import { useDashboardMap, useDashboardSummary, useRevealDashboardCustomer } from "./hooks";

function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${month}/${day}`;
}

export function DashboardPage() {
  const summary = useDashboardSummary();
  const map = useDashboardMap();

  const reveal = useRevealDashboardCustomer();
  const toast = useToast();
  const user = useSessionStore((state) => state.user);
  const canReveal = usePermission("customers:reveal");
  const canViewCustomers = usePermission("customers:view");
  const canNotifications = usePermission("notifications:view");
  const notifications = useNotifications(canNotifications);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [revealed, setRevealed] = useState<{ name: string; latitude: number; longitude: number } | null>(null);

  const customers = useQuery({
    queryKey: ["customers", "options"],
    queryFn: () => queryCustomers({ pageSize: 100, status: "active" }),
    enabled: dialogOpen && canViewCustomers,
    staleTime: 60_000,
  });

  const doReveal = async () => {
    if (!customerId) return;
    try {
      const result = await reveal.mutateAsync({ customerId, field: "location" });
      toast("Exact location revealed. The action was audited.", "success");
      if (result.latitude != null && result.longitude != null) {
        setRevealed({ name: result.name, latitude: result.latitude, longitude: result.longitude });
      }
      setDialogOpen(false);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  if (summary.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <SkeletonRows rows={5} />
      </div>
    );
  }

  if (summary.isError || !summary.data) {
    return (
      <ErrorState
        description={apiMessage(summary.error)}
        action={<Button variant="outline" onClick={() => void summary.refetch()}>Try again</Button>}
      />
    );
  }

  const data = summary.data;
  const firstName = user?.fullName.split(" ")[0] ?? "there";
  const notifItems = notifications.data?.items ?? [];

  const cards = [
    {
      label: "Total Customers",
      value: formatNumber(data.totalCustomers),
      hint: `${formatNumber(data.clientCount)} active`,
      to: "/customers",
      icon: UsersIcon,
      tone: "stat-icon--1",
    },
    {
      label: "Active Subscriptions",
      value: formatNumber(data.activeSubscriptions),
      hint: "Recurring plans",
      to: "/subscriptions",
      icon: CalendarIcon,
      tone: "stat-icon--2",
    },
    {
      label: "Today's Orders",
      value: formatNumber(data.todaysOrders),
      hint: "Scheduled or created today",
      to: "/orders",
      icon: ClipboardIcon,
      tone: "stat-icon--3",
    },
    {
      label: "Pending Orders",
      value: formatNumber(data.pendingOrders),
      hint: "Awaiting delivery",
      to: "/orders?status=Scheduled",
      icon: ClipboardIcon,
      tone: "stat-icon--4",
    },
    {
      label: "Ongoing Deliveries",
      value: formatNumber(data.ongoingDeliveries),
      hint: "Out for delivery",
      to: "/scheduling",
      icon: TruckIcon,
      tone: "stat-icon--1",
    },
    {
      label: "Completed Deliveries",
      value: formatNumber(data.completedDeliveries),
      hint: "Marked complete",
      to: "/orders?status=Completed",
      icon: TruckIcon,
      tone: "stat-icon--2",
    },
    {
      label: "Revenue Overview",
      value: formatCentavos(data.revenueTotalCentavos),
      hint: `Today ${formatCentavos(data.revenueTodayCentavos)} · Month ${formatCentavos(data.revenueMonthCentavos)}`,
      to: "/reports",
      icon: WalletIcon,
      tone: "stat-icon--3",
    },
  ];

  const series = data.analyticsSeries;
  const totalGallons = Math.max(1, data.inventoryFull + data.inventoryWithCustomer);
  const stationShare = data.inventoryFull / totalGallons;
  const maxAreaCount = Math.max(1, ...data.clientLocationStats.map((stat) => stat.count));
  const dm = data.deliveryMonitoring;

  return (
    <div className="animate-rise space-y-4">
      <section className="hero-banner">
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="hero-chip">
              <DropletIcon className="size-3" /> Station overview · {formatDateNumeric(todayIso())}
            </span>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-[1.75rem]">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
              {formatNumber(data.totalCustomers)} customers, {formatNumber(data.activeSubscriptions)} active
              subscriptions, and {formatNumber(data.todaysOrders)} orders today. Everything here comes from
              aggregated API responses.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/reports" className="hero-action hero-action--solid">
                <WalletIcon className="size-3.5" /> Sales report
              </Link>
              <Link to="/heat-map" className="hero-action">
                <MapIcon className="size-3.5" /> Heat map
              </Link>
              <Link to="/orders" className="hero-action">
                <ArrowRightIcon className="size-3.5" /> Order history
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:min-w-[22rem]">
            {[
              { label: "Month sales", value: formatCentavos(data.salesMonthCentavos) },
              { label: "Month orders", value: formatNumber(data.salesMonthCount) },
              { label: "Revenue", value: formatCentavos(data.revenueTotalCentavos) },
            ].map((entry) => (
              <div key={entry.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-white/65">{entry.label}</dt>
                <dd className="mt-0.5 truncate text-base font-semibold tabular-nums text-white">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Dashboard widgets */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="stat-card">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 truncate text-lg font-bold tabular-nums tracking-tight">{card.value}</p>
                  </div>
                  <span className={`stat-icon ${card.tone}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-[0.6875rem] text-muted-foreground">{card.hint}</p>
                  <Link
                    to={card.to}
                    aria-label={`Open ${card.label}`}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales and order analytics charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales analytics</CardTitle>
            <p className="text-xs text-muted-foreground">Revenue per day, last 14 days (Asia/Manila).</p>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {series.length === 0 ? (
              <EmptyState title="No sales yet" />
            ) : (
              <BarChart
                ariaLabel="Daily revenue for the last 14 days"
                accentClass="bg-primary"
                formatValue={(value) => formatCentavos(value)}
                data={series.map((point) => ({
                  label: shortDate(point.date),
                  value: point.salesCentavos,
                  title: `${formatDateNumeric(point.date)}: ${formatCentavos(point.salesCentavos)}`,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order analytics</CardTitle>
            <p className="text-xs text-muted-foreground">Orders created per day, last 14 days.</p>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {series.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <BarChart
                ariaLabel="Orders created per day for the last 14 days"
                accentClass="bg-[var(--chart-2)]"
                data={series.map((point) => ({
                  label: shortDate(point.date),
                  value: point.orders,
                  title: `${formatDateNumeric(point.date)}: ${point.orders} orders`,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Recent customer registrations */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Recent customer registrations</CardTitle>
            <Link to="/customers" className="text-xs font-medium text-primary hover:underline">
              All customers
            </Link>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {data.recentCustomers.length === 0 ? (
              <EmptyState title="No customers yet" />
            ) : (
              <ul className="space-y-2">
                {data.recentCustomers.map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{customer.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{customer.code}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={statusTone(customer.status)}>{customer.status}</Badge>
                      <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                        {customer.createdAt ? formatDateNumeric(customer.createdAt) : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[0.625rem] text-muted-foreground">Names are masked; reveal is audited.</p>
          </CardContent>
        </Card>

        {/* Latest orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Latest orders</CardTitle>
            <Link to="/orders" className="text-xs font-medium text-primary hover:underline">
              Order history
            </Link>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {data.latestOrders.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-2">Customer</th>
                      <th className="py-1.5 pr-2">Type</th>
                      <th className="py-1.5 pr-2">Scheduled</th>
                      <th className="py-1.5 pr-2 text-right">Amount</th>
                      <th className="py-1.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.latestOrders.map((order) => (
                      <tr key={order.id} className="border-t border-border/60">
                        <td className="py-1.5 pr-2">
                          <Link to={`/orders/${order.id}`} className="font-medium hover:underline">
                            {order.customerName}
                          </Link>
                        </td>
                        <td className="py-1.5 pr-2 capitalize text-muted-foreground">{order.type}</td>
                        <td className="py-1.5 pr-2 text-xs text-muted-foreground">
                          {formatDateNumeric(order.scheduledDate)} {formatTime(order.scheduledTime)}
                        </td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{formatCentavos(order.amountCentavos)}</td>
                        <td className="py-1.5 text-right">
                          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Delivery monitoring overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <TruckIcon className="size-4 text-primary" /> Delivery monitoring
            </CardTitle>
            <p className="text-xs text-muted-foreground">Order pipeline at a glance.</p>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <Pipeline label="Scheduled" value={dm.scheduled} total={dm.total} tone="bg-primary" />
            <Pipeline label="Out for delivery" value={dm.ongoing} total={dm.total} tone="bg-warning" />
            <Pipeline label="Completed" value={dm.completed} total={dm.total} tone="bg-success" />
            <Pipeline label="Cancelled" value={dm.cancelled} total={dm.total} tone="bg-destructive" />
            <div className="pt-1 text-xs text-muted-foreground">{formatNumber(dm.total)} total orders tracked.</div>
          </CardContent>
        </Card>

        {/* Inventory status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <PackageIcon className="size-4 text-primary" /> Inventory status
            </CardTitle>
            <p className="text-xs text-muted-foreground">Gallons by state; low-stock items flagged.</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 p-3 pt-0">
            <div
              className="donut"
              role="img"
              aria-label={`${Math.round(stationShare * 100)} percent of tracked gallons are full at the station`}
              style={{ "--donut-full": `${stationShare}turn`, "--donut-used": "1turn" } as CSSProperties}
            >
              <span className="donut-center">
                <span className="text-lg font-bold tabular-nums">{Math.round(stationShare * 100)}%</span>
                <span className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">at station</span>
              </span>
            </div>
            <ul className="w-full space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--chart-1)]" aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">Full gallons</span>
                <span className="font-semibold tabular-nums">{formatNumber(data.inventoryFull)}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--chart-2)]" aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">With customers</span>
                <span className="font-semibold tabular-nums">{formatNumber(data.inventoryWithCustomer)}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--chart-3)]" aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">Items tracked</span>
                <span className="font-semibold tabular-nums">{formatNumber(data.inventoryItemCount)}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--chart-4)]" aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">Low stock</span>
                <span className="font-semibold tabular-nums">{formatNumber(data.lowStockCount)}</span>
              </li>
            </ul>
            {data.lowStockItems.length > 0 ? (
              <ul className="w-full space-y-1 border-t border-border/60 pt-2 text-xs">
                {data.lowStockItems.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-2">
                    <span className="truncate text-muted-foreground">{item.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-warning">
                      {formatNumber(item.gallonsFull)} / {formatNumber(item.reorderLevel)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link to="/inventory" className="w-full text-center text-xs font-medium text-primary hover:underline">
              Manage inventory
            </Link>
          </CardContent>
        </Card>

        {/* Important notifications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5 text-base">
              <BellIcon className="size-4 text-primary" /> Important notifications
            </CardTitle>
            <Link to="/notifications" className="text-xs font-medium text-primary hover:underline">
              All
            </Link>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {notifications.isLoading ? (
              <SkeletonRows rows={4} />
            ) : notifItems.length === 0 ? (
              <EmptyState title="No notifications" description="Transactions appear here as they happen." />
            ) : (
              <ul className="space-y-2">
                {notifItems.slice(0, 6).map((note) => (
                  <li key={note.id} className="rounded-lg border border-border/70 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={note.readAt ? "neutral" : "primary"}>{note.kind}</Badge>
                      <span className="text-[0.625rem] text-muted-foreground">
                        {note.createdAt ? formatDateTime(note.createdAt) : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">{note.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clients by area */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Clients by area</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">Aggregated per barangay. No individual addresses or coordinates.</p>
            </div>
            <Badge tone="primary">{formatNumber(data.totalCustomers)} customers</Badge>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {data.clientLocationStats.length === 0 ? (
              <EmptyState title="No client locations yet" />
            ) : (
              <ul className="space-y-2.5">
                {data.clientLocationStats.map((stat, index) => (
                  <li key={stat.area} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs font-medium sm:w-36">{stat.area}</span>
                    <span className={`metric-bar metric-bar--${(index % 4) + 1} flex-1`}>
                      <span style={{ width: `${Math.max(6, (stat.count / maxAreaCount) * 100)}%` }} />
                    </span>
                    <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">{formatNumber(stat.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <TrendingUpIcon className="size-4 text-primary" /> Revenue snapshot
              </CardTitle>
              <p className="text-xs text-muted-foreground">From completed orders.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <Row label="Today" value={formatCentavos(data.revenueTodayCentavos)} />
            <Row label="This month" value={formatCentavos(data.revenueMonthCentavos)} />
            <Row label="All time" value={formatCentavos(data.revenueTotalCentavos)} />
            <Row label="Orders this month" value={formatNumber(data.salesMonthCount)} />
          </CardContent>
        </Card>
      </div>

      {/* Customer locations */}
      <Card>
        <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <MapPinIcon className="size-4 text-primary" /> Customer locations
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Pins are grouped by barangay and rounded. Exact locations need an audited reveal.</p>
          </div>
          <Link to="/heat-map" className="hero-action hero-action--solid shrink-0">
            <MapIcon className="size-3.5" /> Open heat map
          </Link>
        </CardHeader>
        <CardContent>
          {map.isError ? (
            <ErrorState description={apiMessage(map.error)} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <BaseMap points={map.data?.points ?? []} height="21rem" ariaLabel="Masked customer location map" />
            </div>
          )}
        </CardContent>
      </Card>

      {revealed ? (
        <Card>
          <CardHeader>
            <CardTitle>Revealed location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Alert tone="warning">This reveal was audited with opaque identifiers. It re-masks when you leave the page.</Alert>
            <p className="text-sm">
              <MaskedValue value={revealed.name} revealed canReveal={false} onReveal={() => undefined} />
            </p>
            <BaseMap
              points={[{ label: revealed.name, latitude: revealed.latitude, longitude: revealed.longitude, count: 1 }]}
              height="14rem"
              ariaLabel="Revealed customer location"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {revealed.latitude.toFixed(6)}, {revealed.longitude.toFixed(6)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setRevealed(null)}>
                Hide
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canReveal ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <MapPinIcon /> Reveal exact location
          </Button>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Reveal an exact location"
        description="Choose a customer. The reveal is permissioned and audited."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void doReveal()} disabled={!customerId} loading={reveal.isPending}>
              Reveal
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {customers.isError ? <Alert tone="destructive">{apiMessage(customers.error)}</Alert> : null}
          <label htmlFor="reveal-customer" className="text-xs font-medium text-muted-foreground">
            Customer
          </label>
          <SearchableSelect
            id="reveal-customer"
            options={
              customers.data?.items.map((customer) => ({
                value: customer.id,
                label: customer.name,
                sublabel: customer.code,
              })) ?? []
            }
            value={customerId}
            onChange={setCustomerId}
            placeholder={customers.isLoading ? "Loading customers…" : "Select a customer"}
            emptyMessage="No active customers found."
          />
          <p className="text-xs text-muted-foreground">Only customers whose location is already recorded can be revealed.</p>
        </div>
      </Dialog>
    </div>
  );
}

function Pipeline({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{formatNumber(value)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
