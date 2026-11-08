import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 text-sm", className)} htmlFor={id}>
      <input id={id} type="checkbox" className="size-4 rounded border-input text-primary" {...props} />
      <span>{label}</span>
    </label>
  );
}
