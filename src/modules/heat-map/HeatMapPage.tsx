import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ChevronRightIcon } from "@/components/ui/icons";
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
import { downloadFile, saveBlob } from "@/lib/download";
import { formatNumber } from "@/lib/money";
import { isPreviewMode } from "@/lib/preview";
import { usePermission } from "@/hooks/use-permission";
import { AreaCustomersDialog } from "./AreaCustomersDialog";
import { buildHeatExport, type HeatExportFormat } from "./export-files";
import { useHeatPoints } from "./hooks";
import { HEAT_METRIC_LABELS, type HeatQuery } from "./schemas";
import { getHeatPoints } from "./service";

export function HeatMapPage() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const [metric, setMetric] = useState<HeatQuery["metric"]>("customer-density");
  const [area, setArea] = useState("");
  const [selectedArea, setSelectedArea] = useState<{ area: string; count: number } | null>(null);
  const [exporting, setExporting] = useState<HeatExportFormat | null>(null);
  const normalizedArea = area.trim() || undefined;
  const query = useHeatPoints({ from, to, metric, area: normalizedArea });
  const toast = useToast();
  // Preview mode hides write controls, but these exports are generated from the
  // synthetic cells in the browser and never touch the live database.
  const canExport = usePermission("heatmap:export") || isPreviewMode();

  const exportAs = async (format: HeatExportFormat) => {
    setExporting(format);
    try {
      if (isPreviewMode()) {
        const result =
          query.data ??
          (await getHeatPoints({ from, to, metric, area: normalizedArea }));
        const file = buildHeatExport(format, result.cells, {
          from,
          to,
          metric,
          area: normalizedArea,
          minCellSize: result.minCellSize,
          suppressedCells: result.suppressedCells,
        });
        saveBlob(file.blob, file.filename);
      } else {
        await downloadFile("/heat-map/export", {
          method: "POST",
          body: { from, to, metric, area: normalizedArea, format },
        });
      }
      toast(`Heat map ${format.toUpperCase()} export downloaded.`, "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    } finally {
      setExporting(null);
    }
  };

  const invalidRange = from > to;
  const cells = query.data?.cells ?? [];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Heat Map"
        description="Aggregated density by area. The API never returns individual customer coordinates or names."
        actions={
          canExport ? (
            <div className="flex items-center gap-1" role="group" aria-label="Export heat map">
              {(["csv", "xlsx", "pdf"] as const).map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  loading={exporting === format}
                  disabled={invalidRange || exporting !== null}
                  onClick={() => void exportAs(format)}
                  aria-label={`Export heat map as ${format === "xlsx" ? "Excel" : format.toUpperCase()}`}
                >
                  {format === "xlsx" ? "Excel" : format.toUpperCase()}
                </Button>
              ))}
            </div>
          ) : null
        }
      />

      <div className="card-surface space-y-2 p-3">
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
        <p className="text-xs text-muted-foreground">
          {metric === "customer-density"
            ? "Customer density counts active customers registered between From and To."
            : "Completed deliveries counts completed schedules dated between From and To."}{" "}
          Select an area in the table below to list its customers.
        </p>
      </div>

      {invalidRange ? <Alert tone="warning">The start date must be before the end date.</Alert> : null}

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
              points={cells.map((cell) => ({
                label: cell.area,
                latitude: cell.latitude,
                longitude: cell.longitude,
                count: cell.count,
              }))}
              height="clamp(22rem, 52vh, 36rem)"
              ariaLabel="Heat map of aggregated areas"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Area counts</CardTitle>
          <p className="text-xs text-muted-foreground">
            The non-map alternative for the same data. Select an area to see all of its customers.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="p-3">
              <SkeletonRows rows={6} />
            </div>
          ) : query.isError ? (
            <ErrorState description={apiMessage(query.error)} />
          ) : cells.length === 0 ? (
            <EmptyState
              title="No aggregated cells"
              description="Adjust the date range or area. Customers registered outside the range and cells below the minimum size stay hidden."
            />
          ) : (
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Area</TableHeaderCell>
                    <TableHeaderCell className="text-right">Count</TableHeaderCell>
                    <TableHeaderCell className="w-10">
                      <span className="sr-only">Customers</span>
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cells.map((cell) => (
                    <TableRow key={cell.area}>
                      <TableCell>
                        <button
                          type="button"
                          className="btn-reset inline-flex max-w-full items-center gap-1 text-left font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:underline"
                          onClick={() => setSelectedArea({ area: cell.area, count: cell.count })}
                          aria-label={`Show all customers in ${cell.area}`}
                        >
                          <span className="truncate">{cell.area}</span>
                          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        </button>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(cell.count)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedArea({ area: cell.area, count: cell.count })}
                          aria-label={`View customers in ${cell.area}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      {query.data ? (
        <p className="text-xs text-muted-foreground">
          Minimum cell size {query.data.minCellSize}. {query.data.suppressedCells} small cell(s)
          suppressed to protect privacy.
        </p>
      ) : null}

      <AreaCustomersDialog
        area={selectedArea?.area ?? null}
        cellCount={selectedArea?.count ?? 0}
        onOpenChange={(open) => {
          if (!open) setSelectedArea(null);
        }}
      />
    </div>
  );
}
