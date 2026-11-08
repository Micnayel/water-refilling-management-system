import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldIcon } from "@/components/ui/icons";
import { LoaderIcon } from "@/components/ui/icons";
import { useSessionStore, hasGrant } from "@/stores/session-store";

export function FullPageLoader({ label = "Loading your workspace…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderIcon className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      <ShieldIcon className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account does not have the grant required for this area. Ask an administrator if you
        need access.
      </p>
      <Button variant="outline" onClick={() => window.history.back()}>
        Go back
      </Button>
    </div>
  );
}

export function ProtectedRoute({
  grant,
  children,
}: {
  grant?: string;
  children: ReactNode;
}) {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "anonymous" || !user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  if (grant && !hasGrant(user, grant)) return <ForbiddenPage />;
  return <>{children}</>;
}
