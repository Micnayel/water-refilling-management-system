import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";
import { BellIcon } from "@/components/ui/icons";
import { useMarkNotificationRead, useNotifications } from "./hooks";

export function NotificationsPage() {
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const toast = useToast();

  const onMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Notifications"
        description="Scoped operational notices. Reading one does not complete the underlying work."
      />

      {query.isLoading ? (
        <div className="card-surface p-3">
          <SkeletonRows rows={4} />
        </div>
      ) : query.isError ? (
        <div className="card-surface">
          <ErrorState
            description={apiMessage(query.error)}
            action={
              <Button variant="outline" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        </div>
      ) : query.data && query.data.items.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            title="No notifications"
            description="Notices for your scope and grants will appear here."
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {query.data?.items.map((notification) => {
            const unread = notification.readAt === null;
            return (
              <li key={notification.id}>
                <Card className={unread ? "ring-1 ring-primary/30" : undefined}>
                  <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-2">
                      <BellIcon
                        className={unread ? "mt-0.5 size-4 text-primary" : "mt-0.5 size-4 text-muted-foreground"}
                      />
                      <div className="min-w-0">
                        <p className="text-sm">{notification.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(notification.createdAt)}
                          {unread ? "" : " · read"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={unread ? "primary" : "neutral"}>{notification.kind}</Badge>
                      {unread ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={markRead.isPending && markRead.variables === notification.id}
                          onClick={() => void onMarkRead(notification.id)}
                        >
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
