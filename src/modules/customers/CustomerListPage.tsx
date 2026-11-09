import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/card";
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
import { downloadFile } from "@/lib/download";
import { formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useCustomerList } from "./hooks";

export function CustomerListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "archived">("active");
  const query = useCustomerList(page, pageSize, search, status);
  const navigate = useNavigate();
  const toast = useToast();
  const canAdd = usePermission("customers:add");
  const canExport = usePermission("customers:export");

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const exportCsv = async () => {
    try {
      await downloadFile("/customers/export");
      toast("Customer export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Customers"
        description="Names, contacts, and locations stay masked until an audited reveal."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            {canAdd ? <Button onClick={() => navigate("/customers/new")}>New customer</Button> : null}
          </>
        }
      />

      <form className="toolbar-surface flex flex-wrap items-end gap-2" onSubmit={onSearch} role="search">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="customer-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="customer-search"
            placeholder="Name, code, or barangay"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="customer-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect
            id="customer-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | "active" | "archived");
              setPage(1);
            }}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="">All</option>
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

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
            title="No customers found"
            description="Adjust the filters, or add a new customer."
            action={canAdd ? <Button onClick={() => navigate("/customers/new")}>New customer</Button> : undefined}
          />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Code</TableHeaderCell>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Contact</TableHeaderCell>
                    <TableHeaderCell>Barangay</TableHeaderCell>
                    <TableHeaderCell className="text-right">Gallons on hand</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data?.items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono text-xs">{customer.code}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.contact || "—"}</TableCell>
                      <TableCell>{customer.barangay || "—"}</TableCell>
                      <TableCell className="text-right">{formatNumber(customer.gallonsOnHand)}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(customer.status)}>{customer.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/customers/${customer.id}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
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
    </div>
  );
}
