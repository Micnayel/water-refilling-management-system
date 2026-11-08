import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { SESSION_TIMEOUT_OPTIONS, useSettingsStore } from "@/stores/settings-store";
import { usePermission } from "@/hooks/use-permission";
import { useSaveSystemSettings, useSystemSettings } from "./hooks";

export function SystemMaintenancePage() {
  const query = useSystemSettings();
  const save = useSaveSystemSettings();
  const canEdit = usePermission("settings:edit");
  const storeTimeout = useSettingsStore((state) => state.sessionTimeoutMinutes);
  const setStoreTimeout = useSettingsStore((state) => state.setSessionTimeout);
  const toast = useToast();
  const [timeoutMinutes, setTimeoutMinutes] = useState(storeTimeout);
  const [version, setVersion] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!query.data) return;
    const setting = query.data.items.find((item) => item.key === "sessionTimeoutMinutes");
    if (setting) {
      const value = Number(setting.value);
      if (SESSION_TIMEOUT_OPTIONS.includes(value as (typeof SESSION_TIMEOUT_OPTIONS)[number])) {
        setTimeoutMinutes(value);
      }
      setVersion(setting.version);
    }
  }, [query.data]);

  const onSave = async () => {
    try {
      await save.mutateAsync({ sessionTimeoutMinutes: timeoutMinutes, version });
      setStoreTimeout(timeoutMinutes);
      toast("System settings saved.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="System maintenance"
        description="System-wide settings require settings:edit and are audited."
      />

      {!canEdit ? (
        <Alert tone="warning">You need the settings:edit grant to change system-wide settings.</Alert>
      ) : null}

      {query.isLoading ? (
        <div className="p-3">
          <SkeletonRows rows={4} />
        </div>
      ) : query.isError ? (
        <ErrorState description={apiMessage(query.error)} />
      ) : (
        <div className="card-surface max-w-xl space-y-3 p-3">
          <Field
            label="Session idle timeout"
            htmlFor="session-timeout"
            hint="The browser warns 60 seconds before signing out. The API enforces its own lifetime."
          >
            <NativeSelect
              id="session-timeout"
              value={timeoutMinutes}
              onChange={(event) => setTimeoutMinutes(Number(event.target.value))}
              disabled={!canEdit}
            >
              {SESSION_TIMEOUT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} minutes
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Button onClick={() => void onSave()} disabled={!canEdit} loading={save.isPending}>
            Save system settings
          </Button>
        </div>
      )}

      <Alert tone="info">
        The client timer only clears the browser session and cache. Session expiry and revocation are
        enforced by the API.
      </Alert>
    </div>
  );
}
