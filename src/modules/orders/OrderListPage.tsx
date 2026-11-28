import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
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
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric, formatTime } from "@/lib/dates";
import { downloadFile } from "@/lib/download";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { SCHEDULE_STATUSES } from "@/modules/scheduling";
import { useOrderList } from "./hooks";

export function OrderListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = useOrderList(page, pageSize, status, from, to);
  const canExport = usePermission("scheduling:export");
  const canCreate = usePermission("scheduling:add");
  const toast = useToast();
  const navigate = useNavigate();

  const exportCsv = async () => {
    try {
      await downloadFile("/schedules/export");
      toast("Order history export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Order history"
        description="Every order placed, across refills and deliveries, with status and amounts."
        actions={
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            {canCreate ? <Button onClick={() => navigate("/scheduling/new")}>New order</Button> : null}
          </div>
        }
      />

      <div className="toolbar-surface flex flex-wrap items-end gap-2">
        <div className="w-44">
          <label htmlFor="order-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect
            id="order-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {SCHEDULE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-44">
          <label htmlFor="order-from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <DatePicker id="order-from" value={from} onChange={(value) => { setFrom(value); setPage(1); }} />
        </div>
        <div className="w-44">
          <label htmlFor="order-to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <DatePicker id="order-to" value={to} onChange={(value) => { setTo(value); setPage(1); }} />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {query.isLoading ? (
          <div className="p-3">
            <SkeletonRows rows={6} />
          </div>
        ) : query.isError ? (
          <ErrorState
            description={apiMessage(query.error)}
            action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
          />
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState title="No orders found" description="Adjust the filters or create a new order." />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Scheduled</TableHeaderCell>
                    <TableHeaderCell className="text-right">Gallons</TableHeaderCell>
                    <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data?.items.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Button variant="link" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                          {order.id.slice(0, 8)}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell className="capitalize">{order.type}</TableCell>
                      <TableCell>
                        {formatDateNumeric(order.scheduledDate)} {formatTime(order.scheduledTime)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(order.gallons)}</TableCell>
                      <TableCell className="text-right">{formatCentavos(order.amountCentavos)}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageSize={pageSize}
              itemCount={query.data?.items.length ?? 0}
              hasNext={Boolean(query.data?.nextCursor)}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
