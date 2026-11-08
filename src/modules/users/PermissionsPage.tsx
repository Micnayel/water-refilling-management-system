import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, TableWrap } from "@/components/ui/table";
import { GRANT_GROUPS } from "@/config/grants";
import { apiMessage } from "@/lib/api-client";
import { CheckIcon } from "@/components/ui/icons";
import { useRoles } from "./hooks";

export function PermissionsPage() {
  const query = useRoles();

  return (
    <div className="space-y-3">
      <PageHeader
        title="Permissions"
        description="Read-only matrix of role default grants. The API enforces every grant."
        actions={
          <Link to="/administration/roles" className={buttonVariants({ variant: "outline" })}>
            Edit roles
          </Link>
        }
      />

      <Alert tone="info">
        Reads require both admin:view and admin:edit at the API boundary. Frontend gating is for the
        user experience only.
      </Alert>

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
        ) : (
          <TableWrap>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="sticky left-0 bg-muted/50">Grant</TableHeaderCell>
                  {query.data?.items.map((role) => (
                    <TableHeaderCell key={role.id} className="whitespace-nowrap text-center">
                      {role.name}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {GRANT_GROUPS.map((group) => (
                  <Fragment key={group.label}>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={(query.data?.items.length ?? 0) + 1} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </TableCell>
                    </TableRow>
                    {group.grants.map((grant) => (
                      <TableRow key={grant.key}>
                        <TableCell className="sticky left-0 bg-card">
                          <span className="block text-sm">{grant.label}</span>
                          <span className="block font-mono text-xs text-muted-foreground">{grant.key}</span>
                        </TableCell>
                        {query.data?.items.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            {role.grants.includes(grant.key) ? (
                              <CheckIcon className="mx-auto text-success" aria-label="Granted" />
                            ) : (
                              <span className="text-muted-foreground" aria-label="Not granted">
                                —
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableWrap>
        )}
      </div>
    </div>
  );
}
