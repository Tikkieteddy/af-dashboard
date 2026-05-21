"use client";

import { formatThaiDate } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default function DateRangePicker({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="w-4 h-4 text-af-gray-dark" />
      <span className="text-xs text-af-gray-dark">ช่วงวันที่:</span>
      <input
        type="date"
        value={start}
        max={end}
        onChange={(e) => onChange(e.target.value, end)}
        className="af-input !py-1.5 !px-2 text-xs w-auto"
      />
      <span className="text-af-gray-dark text-xs">ถึง</span>
      <input
        type="date"
        value={end}
        min={start}
        onChange={(e) => onChange(start, e.target.value)}
        className="af-input !py-1.5 !px-2 text-xs w-auto"
      />
      <span className="text-[11px] text-af-gray-dark hidden md:inline">
        ({formatThaiDate(start, false)} — {formatThaiDate(end)})
      </span>
    </div>
  );
}
