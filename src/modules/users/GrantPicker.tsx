import { GRANT_GROUPS } from "@/config/grants";
import { cn } from "@/lib/utils";

export interface GrantPickerProps {
  value: string[];
  onChange: (grants: string[]) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function GrantPicker({ value, onChange, disabled, idPrefix = "grant" }: GrantPickerProps) {
  const toggle = (grant: string, checked: boolean) => {
    onChange(checked ? [...value, grant] : value.filter((entry) => entry !== grant));
  };

  return (
    <div className={cn("space-y-3", disabled && "opacity-70")}>
      {GRANT_GROUPS.map((group) => (
        <fieldset key={group.label} disabled={disabled}>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {group.grants.map((grant) => {
              const id = `${idPrefix}-${grant.key}`;
              return (
                <label key={grant.key} htmlFor={id} className="flex items-center gap-2 text-sm">
                  <input
                    id={id}
                    type="checkbox"
                    className="size-4 rounded border-input text-primary"
                    checked={value.includes(grant.key)}
                    onChange={(event) => toggle(grant.key, event.target.checked)}
                    disabled={disabled}
                  />
                  <span>{grant.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
