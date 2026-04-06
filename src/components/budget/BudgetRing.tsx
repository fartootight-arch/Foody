"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatGBP } from "@/lib/utils";

interface BudgetRingProps {
  spent: number;
  total: number;
}

export function BudgetRing({ spent, total }: BudgetRingProps) {
  const remaining = Math.max(total - spent, 0);
  const percentUsed = total > 0 ? Math.min((spent / total) * 100, 100) : 0;

  const data = [
    { name: "Spent", value: Math.max(spent, 0) },
    { name: "Remaining", value: remaining },
  ];

  const color = percentUsed > 90 ? "#EF4444" : percentUsed > 70 ? "#F59E0B" : "#F97316";

  return (
    <div className="relative h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="#E5E7EB" />
          </Pie>
          <Tooltip
            formatter={(value) => formatGBP(Number(value))}
            contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-xs text-gray-400">remaining</p>
        <p className="text-2xl font-bold text-gray-900">{formatGBP(remaining)}</p>
        <p className="text-xs text-gray-500">{Math.round(percentUsed)}% used</p>
      </div>
    </div>
  );
}
