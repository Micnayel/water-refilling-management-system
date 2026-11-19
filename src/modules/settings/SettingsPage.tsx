import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { BaseMap } from "@/components/maps";
import { SYSTEM_TEMPLATES, templateName } from "@/config/system-templates";
import { stationLocation as defaultStation } from "@/config/brand";
import { apiMessage } from "@/lib/api-client";
import { isPreviewMode } from "@/lib/preview";
import { useToast } from "@/components/ui/toaster";
import { usePreferencesStore } from "@/stores/preferences-store";
import { hasGrant, useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/ui/icons";
import { usePermission } from "@/hooks/use-permission";
import { usePreferences, useSaveStationLocation, useSaveTemplate, useStationLocation } from "./hooks";
import { stationLocationSchema, type StationLocationValues } from "./schemas";

export function SettingsPage() {
  const preferences = usePreferences();
  const saveTemplate = useSaveTemplate();
  const template = usePreferencesStore((state) => state.template);
  const setTemplate = usePreferencesStore((state) => state.setTemplate);
  const toast = useToast();
  const user = useSessionStore((state) => state.user);
  const canEditSettings = usePermission("settings:edit");
  // Preview mode keeps system-wide writes hidden, but the station location is
  // an in-memory demo setting so its save flow can be reviewed.
  const canEditStation = hasGrant(user, "settings:edit") && (canEditSettings || isPreviewMode());

  const stationQuery = useStationLocation();
  const saveStation = useSaveStationLocation();
  const [stationVersion, setStationVersion] = useState<number | undefined>(undefined);
  const stationForm = useForm<StationLocationValues>({
    resolver: zodResolver(stationLocationSchema),
    defaultValues: {
      label: "",
      latitude: defaultStation.latitude,
      longitude: defaultStation.longitude,
    },
  });

  useEffect(() => {
    if (preferences.data) setTemplate(preferences.data.template);
  }, [preferences.data, setTemplate]);

  useEffect(() => {
    if (!stationQuery.data) return;
    setStationVersion(stationQuery.data.version);
    stationForm.reset({
      label: stationQuery.data.label,
      latitude: stationQuery.data.latitude,
      longitude: stationQuery.data.longitude,
    });
  }, [stationQuery.data, stationForm]);

  const choose = async (id: string) => {
    const previous = template;
    setTemplate(id);
    try {
      await saveTemplate.mutateAsync(id);
      toast(`Template changed to ${templateName(id)}.`, "success");
    } catch (error) {
      setTemplate(previous);
      toast(apiMessage(error), "error");
    }
  };

  const saveStationLocation = stationForm.handleSubmit(async (values) => {
    try {
      const saved = await saveStation.mutateAsync({ ...values, version: stationVersion });
      setStationVersion(saved.version);
      toast("Station location saved. Heat Map directions start here.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  });

  const previewLat = stationForm.watch("latitude");
  const previewLng = stationForm.watch("longitude");
  const previewLabel = stationForm.watch("label");
  const hasPreview =
    Number.isFinite(previewLat) &&
    Number.isFinite(previewLng) &&
    Math.abs(previewLat) <= 90 &&
    Math.abs(previewLng) <= 180;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Settings"
        description="Choose your system template and set the station location used for driving directions."
      />

      {preferences.isError ? (
        <Alert tone="destructive">{apiMessage(preferences.error)}</Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SYSTEM_TEMPLATES.map((item) => {
          const selected = template === item.id;
          return (
            <Card key={item.id} className={cn(selected && "ring-2 ring-ring")}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                </div>
                {selected ? <CheckIcon className="text-success" aria-label="Selected template" /> : null}
              </CardHeader>
              <CardContent className="space-y-2">
                <div
                  className="flex h-14 items-center gap-1 overflow-hidden rounded-md border border-border p-1"
                  data-theme={item.id}
                  aria-hidden="true"
                >
                  <span className="h-full flex-1 rounded bg-primary" />
                  <span className="h-full flex-1 rounded bg-secondary" />
                  <span className="h-full flex-1 rounded bg-accent" />
                  <span className="h-full flex-1 rounded bg-muted" />
                </div>
                <Button
                  variant={selected ? "secondary" : "outline"}
                  className="w-full"
                  disabled={selected}
                  loading={saveTemplate.isPending && saveTemplate.variables === item.id}
                  onClick={() => void choose(item.id)}
                >
                  {selected ? "Selected" : "Use this template"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Station location</CardTitle>
          <p className="text-xs text-muted-foreground">
            Heat Map driving directions start from this point. Only users with{" "}
            <span className="font-semibold">settings:edit</span> can change it, and every change is
            audited.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {stationQuery.isError ? (
            <Alert tone="destructive">{apiMessage(stationQuery.error)}</Alert>
          ) : null}
          {!canEditStation ? (
            <Alert tone="info">
              You can view the station location. Ask an Administrator for settings:edit to change it.
            </Alert>
          ) : null}
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveStationLocation} noValidate>
            <div className="sm:col-span-2">
              <Field
                label="Station label"
                htmlFor="station-label"
                error={stationForm.formState.errors.label?.message}
                hint="Shown in review screens only; it is not part of the directions request."
              >
                <Input
                  id="station-label"
                  placeholder="Quezon City station"
                  disabled={!canEditStation}
                  {...stationForm.register("label")}
                />
              </Field>
            </div>
            <Field
              label="Latitude"
              htmlFor="station-latitude"
              error={stationForm.formState.errors.latitude?.message}
              hint="Decimal degrees, for example 14.676."
              required
            >
              <Input
                id="station-latitude"
                type="number"
                step="any"
                inputMode="decimal"
                disabled={!canEditStation}
                {...stationForm.register("latitude", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Longitude"
              htmlFor="station-longitude"
              error={stationForm.formState.errors.longitude?.message}
              hint="Decimal degrees, for example 121.0437."
              required
            >
              <Input
                id="station-longitude"
                type="number"
                step="any"
                inputMode="decimal"
                disabled={!canEditStation}
                {...stationForm.register("longitude", { valueAsNumber: true })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!canEditStation} loading={saveStation.isPending}>
                Save station location
              </Button>
            </div>
          </form>
          {hasPreview ? (
            <BaseMap
              points={[
                {
                  label: previewLabel || "Station",
                  latitude: previewLat,
                  longitude: previewLng,
                  count: 1,
                },
              ]}
              height="12rem"
              ariaLabel="Station location preview"
            />
          ) : null}
        </CardContent>
      </Card>

      <Alert tone="info">
        Templates only swap design-token values. No component hardcodes a template, and every
        template keeps accessible text contrast.
      </Alert>
    </div>
  );
}
