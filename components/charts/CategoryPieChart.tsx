"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: { name: string; value: number }[];
};

const COLORS = [
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#F97316",
  "#6B7280",
];

export default function CategoryPieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="42%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [
            `$${Number(v).toLocaleString("es-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ""
          ]}
          contentStyle={{
            borderRadius: "10px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "12px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
