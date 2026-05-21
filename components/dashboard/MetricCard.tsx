import { cn } from "@/lib/utils";

export default function MetricCard({
  label,
  value,
  hint,
  accent = "pink",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "pink" | "orange" | "navy";
  icon?: React.ReactNode;
}) {
  const accentClass = {
    pink: "from-af-pink to-af-pink-dark",
    orange: "from-af-orange to-orange-600",
    navy: "from-af-navy to-af-navy-light",
  }[accent];

  return (
    <div className="af-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-af-gray-dark uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center",
              accentClass,
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-af-navy break-all">
        {value}
      </p>
      {hint && <p className="text-xs text-af-gray-dark mt-1">{hint}</p>}
    </div>
  );
}
