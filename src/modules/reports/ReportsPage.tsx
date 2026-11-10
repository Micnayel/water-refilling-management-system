import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import {
  CalendarIcon,
  DropletIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { apiMessage } from "@/lib/api-client";
import { daysAgoIso, todayIso } from "@/lib/dates";
import { downloadFile } from "@/lib/download";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useReport } from "./hooks";

export function ReportsPage() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const query = useReport(from, to);
  const toast = useToast();
  const canExport = usePermission("reports:export");

  const exportCsv = async () => {
    try {
      await downloadFile(`/reports/export?from=${from}&to=${to}`);
      toast("Report export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  const statusTotal = query.data?.schedulesByStatus.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const maxStatus = Math.max(1, ...(query.data?.schedulesByStatus.map((row) => row.count) ?? []));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Aggregated sales, deliveries, and customer figures for a period."
        actions={
          canExport ? (
            <Button variant="outline" onClick={() => void exportCsv()}>
              Export
            </Button>
          ) : null
        }
      />

      <div className="toolbar-surface flex flex-wrap items-end gap-2">
        <div className="w-40">
          <label htmlFor="report-from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <DatePicker id="report-from" value={from} onChange={setFrom} maxDate={to} />
        </div>
        <div className="w-40">
          <label htmlFor="report-to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <DatePicker id="report-to" value={to} onChange={setTo} minDate={from} />
        </div>
        <Badge tone="neutral" className="mb-1">
          {from} → {to}
        </Badge>
      </div>

      {from > to ? <Alert tone="warning">The start date must be before the end date.</Alert> : null}

      {query.isLoading ? (
        <SkeletonRows rows={5} />
      ) : query.isError ? (
        <ErrorState
          description={apiMessage(query.error)}
          action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
        />
      ) : query.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Sales",
                value: formatCentavos(query.data.salesCentavos),
                hint: `${formatNumber(query.data.salesCount)} sales`,
                icon: WalletIcon,
                tone: "stat-icon--1",
              },
              {
                label: "Gallons delivered",
                value: formatNumber(query.data.gallonsDelivered),
                hint: "Completed deliveries",
                icon: DropletIcon,
                tone: "stat-icon--2",
              },
              {
                label: "New customers",
                value: formatNumber(query.data.newCustomers),
                hint: "Added in this period",
                icon: UsersIcon,
                tone: "stat-icon--3",
              },
              {
                label: "Schedules",
                value: formatNumber(statusTotal),
                hint: "All statuses",
                icon: CalendarIcon,
                tone: "stat-icon--4",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="stat-card">
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-1 truncate text-2xl font-bold tabular-nums tracking-tight">{card.value}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{card.hint}</p>
                    </div>
                    <span className={`stat-icon ${card.tone}`}>
                      <Icon className="size-4" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <TrendingUpIcon className="size-4 text-primary" /> Schedules by status
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Every schedule in the selected period, grouped by lifecycle status.
                </p>
              </div>
              <Badge tone="primary">{formatNumber(statusTotal)} total</Badge>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {query.data.schedulesByStatus.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No schedules in this period.</p>
              ) : (
                <ul className="space-y-3">
                  {query.data.schedulesByStatus.map((row, index) => (
                    <li key={row.status} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">{row.status}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatNumber(row.count)}
                          <span className="ml-1 text-[0.625rem]">
                            ({statusTotal === 0 ? 0 : Math.round((row.count / statusTotal) * 100)}%)
                          </span>
                        </span>
                      </div>
                      <span className={`metric-bar metric-bar--${(index % 4) + 1} block`}>
                        <span style={{ width: `${Math.max(4, (row.count / maxStatus) * 100)}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
