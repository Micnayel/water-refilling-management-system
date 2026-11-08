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
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "m/d/Y",
      altInputClass: "compact-input",
      allowInput: false,
      disableMobile: true,
      defaultDate: value || undefined,
      minDate: minDate || undefined,
      maxDate: maxDate || undefined,
      onChange: (_dates, dateString) => {
        onChangeRef.current(dateString);
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
    pickerRef.current?.setDate(value || [], false);
  }, [value]);

  useEffect(() => {
    pickerRef.current?.set("minDate", minDate || undefined);
    pickerRef.current?.set("maxDate", maxDate || undefined);
  }, [minDate, maxDate]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      className={cn("compact-input", className)}
      placeholder={placeholder}
      disabled={disabled}
      onBlur={onBlur}
      {...aria}
    />
  );
}
