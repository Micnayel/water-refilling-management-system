import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { downloadFile } from "@/lib/download";
import { apiMessage } from "@/lib/api-client";
import { formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { AddStockDialog } from "./AddStockDialog";
import { useInventoryList } from "./hooks";

export function InventoryListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [lowStock, setLowStock] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const query = useInventoryList(page, pageSize, lowStock);
  const navigate = useNavigate();
  const toast = useToast();
  const canAdd = usePermission("inventory:add");
  const canEdit = usePermission("inventory:edit");
  const canExport = usePermission("inventory:export");

  const exportCsv = async () => {
    try {
      await downloadFile("/inventory/export");
      toast("Inventory export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Inventory"
        description="Gallon stock by state. Quantities change only through recorded movements."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            {canEdit ? (
              <Button variant="outline" onClick={() => setStockOpen(true)}>
                Add stock
              </Button>
            ) : null}
            {canAdd ? <Button onClick={() => navigate("/inventory/new")}>Add item</Button> : null}
          </>
        }
      />

      <div className="toolbar-surface inline-flex flex-wrap items-center gap-3">
        <Checkbox
          id="low-stock"
          label="Low stock only"
          checked={lowStock}
          onChange={(event) => {
            setLowStock(event.target.checked);
            setPage(1);
          }}
        />
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
          <EmptyState
            title="No inventory items yet"
            description="Add a gallon item to start tracking stock by state."
            action={canAdd ? <Button onClick={() => navigate("/inventory/new")}>Add item</Button> : undefined}
          />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>SKU</TableHeaderCell>
                    <TableHeaderCell className="text-right">Full</TableHeaderCell>
                    <TableHeaderCell className="text-right">Empty</TableHeaderCell>
                    <TableHeaderCell className="text-right">With customer</TableHeaderCell>
                    <TableHeaderCell className="text-right">Damaged</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.gallonsFull)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.gallonsEmpty)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.gallonsWithCustomer)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.gallonsDamaged)}</TableCell>
                      <TableCell>
                        <Badge tone={item.lowStock ? "warning" : statusTone("active")}>
                          {item.lowStock ? "Low stock" : "In stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/inventory/${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                          View
                        </Link>
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

      <Alert tone="info">
        Stock can never go negative. A stale record returns a conflict and asks you to reload.
      </Alert>

      <AddStockDialog
        open={stockOpen}
        items={query.data?.items ?? []}
        onOpenChange={setStockOpen}
      />
    </div>
  );
}
