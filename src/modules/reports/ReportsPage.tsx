import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
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

  return (
    <div className="space-y-3">
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

      <div className="flex flex-wrap items-end gap-2">
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
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{formatCentavos(query.data.salesCentavos)}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(query.data.salesCount)} sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Gallons delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{formatNumber(query.data.gallonsDelivered)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">New customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{formatNumber(query.data.newCustomers)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Period</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {query.data.from} → {query.data.to}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Schedules by status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {query.data.schedulesByStatus.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No schedules in this period.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {query.data.schedulesByStatus.map((row) => (
                    <li key={row.status} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{row.status}</span>
                      <span className="font-medium">{formatNumber(row.count)}</span>
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
