import type { InputHTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { formatPesoInput, parsePesoToCentavos } from "@/lib/money";
import { Input } from "./input";

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number;
  onValueChange: (centavos: number) => void;
}

export function MoneyInput({ value, onValueChange, onBlur, ...props }: MoneyInputProps) {
  const [text, setText] = useState(formatPesoInput(value));

  useEffect(() => {
    setText(formatPesoInput(value));
  }, [value]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₱
      </span>
      <Input
        {...props}
        className="pl-6"
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onValueChange(parsePesoToCentavos(event.target.value));
        }}
        onBlur={(event) => {
          setText(formatPesoInput(parsePesoToCentavos(event.target.value)));
          onBlur?.(event);
        }}
      />
    </div>
  );
}
