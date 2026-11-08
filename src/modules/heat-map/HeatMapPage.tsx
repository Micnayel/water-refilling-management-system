import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toaster";
import { BaseMap } from "@/components/maps";
import { apiMessage } from "@/lib/api-client";
import { daysAgoIso, todayIso } from "@/lib/dates";
import { downloadFile } from "@/lib/download";
import { formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useHeatPoints } from "./hooks";
import { HEAT_METRIC_LABELS, type HeatQuery } from "./schemas";

export function HeatMapPage() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const [metric, setMetric] = useState<HeatQuery["metric"]>("customer-density");
  const [area, setArea] = useState("");
  const query = useHeatPoints({ from, to, metric, area: area.trim() || undefined });
  const toast = useToast();
  const canExport = usePermission("heatmap:export");

  const exportCsv = async () => {
    try {
      await downloadFile("/heat-map/export", {
        method: "POST",
        body: { from, to, metric, area: area.trim() || undefined },
      });
      toast("Heat map export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  const invalidRange = from > to;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Heat Map"
        description="Aggregated density by area. The API never returns individual customer coordinates or names."
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
          <label htmlFor="heat-from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <DatePicker id="heat-from" value={from} onChange={setFrom} maxDate={to} />
        </div>
        <div className="w-40">
          <label htmlFor="heat-to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <DatePicker id="heat-to" value={to} onChange={setTo} minDate={from} />
        </div>
        <div className="w-48">
          <label htmlFor="heat-metric" className="text-xs font-medium text-muted-foreground">
            Metric
          </label>
          <NativeSelect
            id="heat-metric"
            value={metric}
            onChange={(event) => setMetric(event.target.value as HeatQuery["metric"])}
          >
            {Object.entries(HEAT_METRIC_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-48">
          <label htmlFor="heat-area" className="text-xs font-medium text-muted-foreground">
            Area (optional)
          </label>
          <Input
            id="heat-area"
            placeholder="Barangay"
            value={area}
            onChange={(event) => setArea(event.target.value)}
          />
        </div>
      </div>

      {invalidRange ? <Alert tone="warning">The start date must be before the end date.</Alert> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Density map</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bucketed cells with counts only. Small cells are suppressed.
            </p>
          </CardHeader>
          <CardContent>
            {query.isError ? (
              <ErrorState description={apiMessage(query.error)} />
            ) : (
              <BaseMap
                mode="heat"
                points={(query.data?.cells ?? []).map((cell) => ({
                  label: cell.area,
                  latitude: cell.latitude,
                  longitude: cell.longitude,
                  count: cell.count,
                }))}
                height="20rem"
                ariaLabel="Heat map of aggregated areas"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Area counts</CardTitle>
            <p className="text-xs text-muted-foreground">The non-map alternative for the same data.</p>
          </CardHeader>
          <CardContent className="p-0">
            {query.isLoading ? (
              <div className="p-3">
                <SkeletonRows rows={5} />
              </div>
            ) : query.isError ? (
              <ErrorState description={apiMessage(query.error)} />
            ) : query.data && query.data.cells.length === 0 ? (
              <EmptyState
                title="No aggregated cells"
                description="Adjust the date range or area. Cells below the minimum size stay hidden."
              />
            ) : (
              <TableWrap>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Area</TableHeaderCell>
                      <TableHeaderCell className="text-right">Count</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.data?.cells.map((cell) => (
                      <TableRow key={cell.area}>
                        <TableCell>{cell.area}</TableCell>
                        <TableCell className="text-right">{formatNumber(cell.count)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            )}
          </CardContent>
        </Card>
      </div>

      {query.data ? (
        <p className="text-xs text-muted-foreground">
          Minimum cell size {query.data.minCellSize}. {query.data.suppressedCells} small cell(s)
          suppressed to protect privacy.
        </p>
      ) : null}
    </div>
  );
}
