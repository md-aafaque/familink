"use client";

import React, { useState, useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "../providers/ThemeProvider";
import { Calendar } from "lucide-react";

interface PartialDateInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  className?: string;
  error?: boolean;
}

const PartialDateInput = forwardRef<HTMLInputElement, PartialDateInputProps>(
  ({ value, onChange, onBlur, name, id, className, error }, ref) => {
    const { theme } = useAppTheme();
    const dateInputRef = useRef<HTMLInputElement>(null);

    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");

    useEffect(() => {
      if (value) {
        const parts = value.split("-");
        setYear(parts[0] || "");
        setMonth(parts[1] || "");
        setDay(parts[2] || "");
      } else {
        setYear("");
        setMonth("");
        setDay("");
      }
    }, [value]);

    const updateValue = (y: string, m: string, d: string) => {
      if (!y || y.length < 4) {
        onChange(""); 
        return;
      }
      let result = y;
      if (m) {
        result += `-${m}`;
        if (d) result += `-${d}`;
      }
      onChange(result);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
      setYear(val);
      updateValue(val, month, day);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setMonth(val);
      updateValue(year, val, day);
    };

    const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setDay(val);
      updateValue(year, month, val);
    };

    const handleCalendarPick = () => {
      dateInputRef.current?.showPicker();
    };

    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) return;
      const parts = val.split("-");
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
        updateValue(parts[0], parts[1], parts[2]);
      }
    };

    const months = [
      { value: "", label: "mm" },
      { value: "01", label: "January" }, { value: "02", label: "February" },
      { value: "03", label: "March" }, { value: "04", label: "April" },
      { value: "05", label: "May" }, { value: "06", label: "June" },
      { value: "07", label: "July" }, { value: "08", label: "August" },
      { value: "09", label: "September" }, { value: "10", label: "October" },
      { value: "11", label: "November" }, { value: "12", label: "December" },
    ];

    const days = [
      { value: "", label: "dd" },
      ...Array.from({ length: 31 }, (_, i) => ({
          value: (i + 1).toString().padStart(2, "0"),
          label: (i + 1).toString(),
      }))
    ];

    const cellClass = cn(
      "h-11 border rounded-xl text-sm font-medium outline-none transition-all text-center",
      theme.colors.bg,
      theme.colors.text,
      error ? "border-red-500 focus:ring-red-500/20" : theme.colors.border,
      "focus:ring-2 focus:ring-primary/20 focus:border-primary"
    );

    return (
      <div className={cn("flex items-center gap-1.5", className)} onBlur={onBlur}>
        <div className="grid grid-cols-3 gap-1.5 min-w-0 flex-1">
          <input
            ref={ref}
            type="text"
            name={name}
            id={id}
            placeholder="yyyy"
            value={year}
            onChange={handleYearChange}
            className={cn(cellClass, "px-2")}
          />
          <select
            value={month}
            onChange={handleMonthChange}
            disabled={!year || year.length < 4}
            className={cn(cellClass, "px-1 appearance-none disabled:opacity-30")}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={day}
            onChange={handleDayChange}
            disabled={!month}
            className={cn(cellClass, "px-1 appearance-none disabled:opacity-30")}
          >
            {days.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={handleCalendarPick}
          className={cn(
            "h-11 w-11 flex items-center justify-center rounded-xl border shrink-0 transition-all",
            theme.colors.border,
            "hover:bg-black/5 dark:hover:bg-white/5"
          )}
          title="Pick date from calendar"
        >
          <Calendar className="w-4 h-4" />
        </button>

        <input ref={dateInputRef} type="date" className="hidden"
          onChange={handleNativeDateChange} />
      </div>
    );
  }
);

PartialDateInput.displayName = "PartialDateInput";

export default PartialDateInput;
