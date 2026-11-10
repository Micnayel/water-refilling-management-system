import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import type { Instance } from "flatpickr/dist/types/instance";
import "flatpickr/dist/flatpickr.min.css";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  onBlur?: () => void;
}

/** Storage and API use ISO dates; the picker shows MM/DD/YYYY. */
function isoToDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function displayToIso(value: string): string {
  const [month, day, year] = value.split("/");
  if (!month || !day || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function DatePicker({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "MM/DD/YYYY",
  disabled,
  className,
  onBlur,
  ...aria
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;
    pickerRef.current = flatpickr(inputRef.current, {
      dateFormat: "m/d/Y",
      allowInput: false,
      disableMobile: true,
      defaultDate: isoToDate(value),
      minDate: isoToDate(minDate) ?? undefined,
      maxDate: isoToDate(maxDate) ?? undefined,
      onChange: (_dates, dateString) => {
        onChangeRef.current(displayToIso(dateString));
      },
    });
    return () => {
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // Flatpickr is created once and updated through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pickerRef.current?.setDate(isoToDate(value) ?? [], false);
  }, [value]);

  useEffect(() => {
    pickerRef.current?.set("minDate", isoToDate(minDate) ?? undefined);
    pickerRef.current?.set("maxDate", isoToDate(maxDate) ?? undefined);
  }, [minDate, maxDate]);

  return (
    <input
      ref={inputRef}
      id={id}
      className={cn("compact-input", className)}
      placeholder={placeholder}
      disabled={disabled}
      onBlur={onBlur}
      {...aria}
    />
  );
}
