import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { setCsrfToken } from "@/lib/api-client";
import { applySession, useSessionQuery } from "@/modules/auth";
import { useSessionStore } from "@/stores/session-store";
import { FullPageLoader } from "@/components/layout/ProtectedRoute";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppBoot() {
  const session = useSessionQuery();
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (session.isSuccess) {
      if (session.data) {
        applySession(session.data);
      } else {
        setCsrfToken(null);
        useSessionStore.getState().clear();
      }
      return;
    }
    if (session.isError) {
      useSessionStore.getState().clear();
    }
  }, [session.isSuccess, session.isError, session.data]);

  if (session.isLoading) return <FullPageLoader />;

  if (session.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorState
          title="Cannot reach the workspace"
          description="The session could not be checked. Check the connection and try again."
          action={
            <Button variant="outline" onClick={() => void session.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (status === "loading") return <FullPageLoader />;

  return <RouterProvider router={router} />;
}

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBoot />
    </QueryClientProvider>
  </StrictMode>,
);
