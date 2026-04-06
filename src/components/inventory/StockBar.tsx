import { cn } from "@/lib/utils";

interface StockBarProps {
  current: number;
  min: number;
  max?: number;
  showLabel?: boolean;
  unit?: string;
}

export function StockBar({ current, min, max, showLabel = false, unit }: StockBarProps) {
  const effectiveMax = max ?? Math.max(min * 10, current * 1.5, 1);
  const percentage = Math.min((current / effectiveMax) * 100, 100);
  const minPercent = Math.min((min / effectiveMax) * 100, 100);

  const color =
    current <= 0
      ? "bg-red-500"
      : current <= min
      ? "bg-amber-500"
      : percentage > 50
      ? "bg-green-500"
      : "bg-amber-400";

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {current} {unit}
          </span>
          <span>
            min: {min} {unit}
          </span>
        </div>
      )}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.max(percentage, current > 0 ? 3 : 0)}%` }}
        />
        {/* Min marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-60"
          style={{ left: `${minPercent}%` }}
        />
      </div>
    </div>
  );
}
