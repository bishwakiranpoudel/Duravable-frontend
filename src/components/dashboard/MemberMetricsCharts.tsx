"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DemoBarRow, DemoPieRow } from "@/lib/member-dashboard-demo";

const COPPER = "hsl(28, 57%, 46%)";
const TEAL = "hsl(172, 87%, 29%)";
const CHARCOAL = "hsl(215, 28%, 17%)";
const SAND = "hsl(30, 17%, 66%)";
const SUCCESS = "hsl(153, 40%, 30%)";
const PALETTE = [COPPER, TEAL, CHARCOAL, SAND, SUCCESS];

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-display font-semibold text-[hsl(var(--charcoal))]">{row.name}</p>
      <p className="font-body text-[hsl(var(--warm-stone))]">{row.value}%</p>
    </div>
  );
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[4px] border border-[hsl(var(--sand))] bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-body text-[hsl(var(--warm-stone))]">Recorded visits</p>
      <p className="font-display font-semibold text-[hsl(var(--charcoal))]">{payload[0].value}</p>
    </div>
  );
}

export function VisitMixChart({ data }: { data: DemoPieRow[] }) {
  const rows = data;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={80}
          paddingAngle={2}
        >
          {rows.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }}
          formatter={(value) => <span className="text-[hsl(var(--charcoal))]">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BenefitMixChart({ data }: { data: DemoPieRow[] }) {
  const rows = data;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={76}
          paddingAngle={3}
        >
          {rows.map((_, i) => (
            <Cell key={i} fill={PALETTE[(i + 1) % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }}
          formatter={(value) => <span className="text-[hsl(var(--charcoal))]">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TouchpointsBarChart({ data }: { data: DemoBarRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--sand))" opacity={0.5} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--warm-stone))", fontFamily: "var(--font-body)" }}
          axisLine={{ stroke: "hsl(var(--sand))" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(var(--warm-stone))", fontFamily: "var(--font-body)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--cream))" }} />
        <Bar dataKey="visits" name="Visits" radius={[2, 2, 0, 0]} fill={COPPER} />
      </BarChart>
    </ResponsiveContainer>
  );
}
