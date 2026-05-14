"use client";

import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  data: { day: string; total: number }[];
  color: string;
};

export default function MiniBarChart({ data, color }: Props) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <ResponsiveContainer width="100%" height={48}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Bar dataKey="total" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={color}
              fillOpacity={0.25 + 0.75 * (entry.total / max)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
