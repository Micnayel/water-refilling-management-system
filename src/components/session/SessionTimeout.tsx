import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/modules/auth";
import { useSessionStore } from "@/stores/session-store";
import { IDLE_TIMEOUT_MS, useSettingsStore } from "@/stores/settings-store";

export function SessionTimeout() {
  const status = useSessionStore((state) => state.status);
  const timeoutMinutes = useSettingsStore((state) => state.sessionTimeoutMinutes);
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const signingOut = useRef(false);

  const timeoutMs = timeoutMinutes > 0 ? timeoutMinutes * 60 * 1000 : IDLE_TIMEOUT_MS;

  const signOut = useRef(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    signingOut.current = false;
    lastActivity.current = Date.now();

    const reset = () => {
      lastActivity.current = Date.now();
      setWarning(false);
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "mousemove"];
    for (const event of events) window.addEventListener(event, reset, { passive: true });

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      const remaining = timeoutMs - elapsed;
      if (remaining <= 0) {
        void signOut.current();
      } else if (remaining <= 60_000) {
        setWarning(true);
      }
    }, 5_000);

    const onExpired = () => {
      useSessionStore.getState().clear();
      navigate("/login", { replace: true });
    };
    window.addEventListener("wrms:session-expired", onExpired);

    return () => {
      for (const event of events) window.removeEventListener(event, reset);
      window.clearInterval(interval);
      window.removeEventListener("wrms:session-expired", onExpired);
    };
  }, [status, timeoutMs, navigate]);

  return (
    <Dialog
      open={warning && status === "authenticated"}
      onOpenChange={(open) => {
        if (!open) {
          lastActivity.current = Date.now();
          setWarning(false);
        }
      }}
      title="Still working?"
      description="Your session will end soon due to inactivity. Continue to stay signed in."
      footer={
        <>
          <Button variant="outline" onClick={() => void signOut.current()}>
            Sign out now
          </Button>
          <Button
            onClick={() => {
              lastActivity.current = Date.now();
              setWarning(false);
            }}
          >
            Stay signed in
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        The browser session ends after {timeoutMinutes || 60} minutes of inactivity. Unsaved changes
        are lost when the session ends.
      </p>
    </Dialog>
  );
}
