"use client";

export default function SourceFilter({
  sources,
  value,
  onChange,
}: {
  sources: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (sources.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-af-gray-dark">แหล่งที่มา:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="af-input !py-1.5 !px-2 text-xs w-auto"
      >
        <option value="">ทั้งหมด</option>
        {sources.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
