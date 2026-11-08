import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { BaseMap } from "@/components/maps";
import { MaskedValue } from "@/components/privacy/masked-value";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { queryCustomers } from "@/modules/customers";
import { useDashboardMap, useDashboardSummary, useRevealDashboardCustomer } from "./hooks";

export function DashboardPage() {
  const summary = useDashboardSummary();
  const map = useDashboardMap();
  const reveal = useRevealDashboardCustomer();
  const toast = useToast();
  const canReveal = usePermission("customers:reveal");
  const canViewCustomers = usePermission("customers:view");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [revealed, setRevealed] = useState<{ name: string; latitude: number; longitude: number } | null>(
    null,
  );

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
      <div className="space-y-3">
        <PageHeader title="Dashboard" description="Aggregated from the API. No raw customer rows." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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
  const cards = [
    {
      label: "Sales today",
      value: formatCentavos(data.salesTodayCentavos),
      hint: `${formatNumber(data.salesTodayCount)} completed today`,
      to: "/reports",
    },
    {
      label: "Clients",
      value: formatNumber(data.clientCount),
      hint: `${data.clientLocationStats.length} areas`,
      to: "/customers",
    },
    {
      label: "Full gallons",
      value: formatNumber(data.inventoryFull),
      hint: `${formatNumber(data.inventoryWithCustomer)} with customers`,
      to: "/inventory",
    },
    {
      label: "Low stock items",
      value: formatNumber(data.lowStockCount),
      hint: data.lowStockCount > 0 ? "Needs attention" : "All above reorder level",
      to: "/inventory",
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Dashboard"
        description="Sales, clients, locations, and inventory from aggregated API responses."
        actions={
          canReveal ? (
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Reveal exact location
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{card.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>
              <Link to={card.to} className="mt-2 inline-block text-xs text-primary hover:underline">
                Open module
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer locations</CardTitle>
            <p className="text-xs text-muted-foreground">
              Pins are grouped by barangay and rounded. Exact locations need an audited reveal.
            </p>
          </CardHeader>
          <CardContent>
            {map.isError ? (
              <ErrorState description={apiMessage(map.error)} />
            ) : (
              <BaseMap points={map.data?.points ?? []} height="18rem" ariaLabel="Masked customer location map" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients by area</CardTitle>
            <p className="text-xs text-muted-foreground">Non-map alternative with the same data.</p>
          </CardHeader>
          <CardContent className="p-0">
            {data.clientLocationStats.length === 0 ? (
              <EmptyState title="No client locations yet" />
            ) : (
              <ul className="divide-y divide-border">
                {data.clientLocationStats.map((stat) => (
                  <li key={stat.area} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{stat.area}</span>
                    <span className="font-medium">{formatNumber(stat.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {revealed ? (
        <Card>
          <CardHeader>
            <CardTitle>Revealed location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Alert tone="warning">
              This reveal was audited with opaque identifiers. It re-masks when you leave the page.
            </Alert>
            <p className="text-sm">
              <MaskedValue
                value={revealed.name}
                revealed
                canReveal={false}
                onReveal={() => undefined}
              />
            </p>
            <BaseMap
              points={[
                {
                  label: revealed.name,
                  latitude: revealed.latitude,
                  longitude: revealed.longitude,
                  count: 1,
                },
              ]}
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

      <div className="flex flex-wrap gap-2 text-xs">
        <Link to="/heat-map" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Open heat map
        </Link>
        <Link to="/scheduling" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Open scheduling
        </Link>
        <Link to="/reports" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Open reports
        </Link>
      </div>

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
          <p className="text-xs text-muted-foreground">
            Only customers whose location is already recorded can be revealed.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
