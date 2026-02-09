"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tooltipStyle = {
  backgroundColor: "hsl(0, 0%, 10%)",
  border: "1px solid hsl(0, 0%, 13%)",
  borderRadius: "8px",
  color: "#fff",
};

interface MetricPoint {
  month: string;
  roas: number;
  mediaSpend: number;
  revenue: number;
}

export function ClientMetricsChart({ metrics }: { metrics: MetricPoint[] }) {
  if (metrics.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma métrica registrada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Métricas de Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="roas">
          <TabsList>
            <TabsTrigger value="roas">ROAS</TabsTrigger>
            <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          </TabsList>
          <TabsContent value="roas">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 13%)" />
                <XAxis dataKey="month" stroke="hsl(240, 4%, 46%)" fontSize={12} />
                <YAxis stroke="hsl(240, 4%, 46%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="roas"
                  stroke="hsl(147, 100%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(147, 100%, 50%)", r: 4 }}
                  name="ROAS"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="revenue">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 13%)" />
                <XAxis dataKey="month" stroke="hsl(240, 4%, 46%)" fontSize={12} />
                <YAxis
                  stroke="hsl(240, 4%, 46%)"
                  fontSize={12}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar
                  dataKey="mediaSpend"
                  fill="hsl(217, 91%, 60%)"
                  radius={[4, 4, 0, 0]}
                  name="Media Spend"
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(147, 100%, 50%)"
                  radius={[4, 4, 0, 0]}
                  name="Faturamento"
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
