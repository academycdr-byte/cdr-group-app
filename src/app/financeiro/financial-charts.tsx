"use client";

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  primary: "hsl(147, 100%, 50%)",
  blue: "hsl(217, 91%, 60%)",
  purple: "hsl(271, 91%, 65%)",
  yellow: "hsl(43, 96%, 56%)",
  red: "hsl(0, 84%, 60%)",
  cyan: "hsl(190, 90%, 50%)",
  orange: "hsl(25, 95%, 53%)",
};

const tooltipStyle = {
  backgroundColor: "hsl(0, 0%, 10%)",
  border: "1px solid hsl(0, 0%, 13%)",
  borderRadius: "8px",
  color: "#fff",
};

interface CashFlowChartProps {
  data: { month: string; receita: number; despesas: number }[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fluxo de Caixa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 13%)" />
            <XAxis dataKey="month" stroke="hsl(240, 4%, 46%)" fontSize={12} />
            <YAxis
              stroke="hsl(240, 4%, 46%)"
              fontSize={12}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(value))
              }
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke={COLORS.primary}
              fillOpacity={1}
              fill="url(#colorReceita)"
              strokeWidth={2}
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke={COLORS.red}
              fillOpacity={1}
              fill="url(#colorDespesas)"
              strokeWidth={2}
              name="Despesas"
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ExpenseBreakdownProps {
  data: { name: string; value: number }[];
}

const CATEGORY_COLORS = [
  COLORS.primary,
  COLORS.blue,
  COLORS.purple,
  COLORS.yellow,
  COLORS.red,
  COLORS.cyan,
  COLORS.orange,
];

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma despesa registrada</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(value))
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
