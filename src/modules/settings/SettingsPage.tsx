import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SYSTEM_TEMPLATES, templateName } from "@/config/system-templates";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { usePreferencesStore } from "@/stores/preferences-store";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/ui/icons";
import { usePreferences, useSaveTemplate } from "./hooks";

export function SettingsPage() {
  const preferences = usePreferences();
  const saveTemplate = useSaveTemplate();
  const template = usePreferencesStore((state) => state.template);
  const setTemplate = usePreferencesStore((state) => state.setTemplate);
  const toast = useToast();

  useEffect(() => {
    if (preferences.data) setTemplate(preferences.data.template);
  }, [preferences.data, setTemplate]);

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

  return (
    <div className="space-y-3">
      <PageHeader
        title="Settings"
        description="Choose the system template for your account. It follows you across devices."
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

      <Alert tone="info">
        Templates only swap design-token values. No component hardcodes a template, and every
        template keeps accessible text contrast.
      </Alert>
    </div>
  );
}
