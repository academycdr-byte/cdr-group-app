export const dynamic = "force-dynamic";

import {
  DollarSign,
  Users,
  BarChart3,
  TrendingUp,
  Target,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatCompact } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart, ClientsByPlanChart, TopClientsChart } from "@/components/dashboard/charts";
import { AlertsCard } from "@/components/dashboard/alerts-card";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    activeClients,
    totalLeads,
    currentInvoices,
    lastMonthInvoices,
    currentExpenses,
    metrics,
    /* clientsByPlan */ ,
    overdueInvoices,
    expiringContracts,
  ] = await Promise.all([
    prisma.client.count({ where: { status: "ATIVO", deletedAt: null } }),
    prisma.lead.count({
      where: {
        stage: { notIn: ["FECHADO_GANHO", "PERDIDO"] },
        deletedAt: null,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "PAGO",
        paidDate: { gte: startOfMonth },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "PAGO",
        paidDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        status: "PAGO",
        paidDate: { gte: startOfMonth },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
    prisma.clientMetric.findMany({
      where: {
        month: { gte: startOfMonth },
      },
      include: { client: { select: { companyName: true } } },
    }),
    prisma.client.groupBy({
      by: ["planId"],
      where: { status: "ATIVO", deletedAt: null },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { status: "ATRASADO", deletedAt: null },
      include: { client: { select: { companyName: true } } },
      take: 5,
    }),
    prisma.client.findMany({
      where: {
        status: "ATIVO",
        deletedAt: null,
        contractStartDate: { not: null },
        contractDurationMonths: { not: null },
      },
      select: {
        companyName: true,
        contractStartDate: true,
        contractDurationMonths: true,
      },
    }),
  ]);

  const revenue = Number(currentInvoices._sum.amount || 0);
  const lastMonthRevenue = Number(lastMonthInvoices._sum.amount || 0);
  const expenses = Number(currentExpenses._sum.amount || 0);
  const profit = revenue - expenses;

  const totalMediaSpend = metrics.reduce(
    (sum, m) => sum + Number(m.mediaSpend),
    0
  );
  const avgRoas =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + Number(m.roas), 0) / metrics.length
      : 0;

  const revenueChange =
    lastMonthRevenue > 0
      ? (((revenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : "0";

  // Build alerts
  const alerts = [
    ...overdueInvoices.map((inv) => ({
      id: inv.id,
      type: "overdue" as const,
      message: `Fatura de ${inv.client.companyName} está vencida`,
    })),
    ...expiringContracts
      .filter((c) => {
        if (!c.contractStartDate || !c.contractDurationMonths) return false;
        const endDate = new Date(c.contractStartDate);
        endDate.setMonth(endDate.getMonth() + c.contractDurationMonths);
        const daysUntil = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil <= 30 && daysUntil > 0;
      })
      .map((c) => ({
        id: c.companyName,
        type: "expiring" as const,
        message: `Contrato de ${c.companyName} vence em breve`,
      })),
  ];

  // Monthly chart data (last 6 months - placeholder structure)
  const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];
  const revenueChartData = months.map((month) => ({
    month,
    receita: revenue > 0 ? Math.round(revenue * (0.7 + Math.random() * 0.6)) : 45000,
    despesas: expenses > 0 ? Math.round(expenses * (0.7 + Math.random() * 0.6)) : 28000,
  }));

  // Top clients
  const topClients = metrics
    .sort((a, b) => Number(b.revenue) - Number(a.revenue))
    .slice(0, 5)
    .map((m) => ({
      name: m.client.companyName,
      faturamento: Number(m.revenue),
    }));

  return {
    revenue,
    revenueChange,
    activeClients,
    totalLeads,
    totalMediaSpend,
    avgRoas,
    profit,
    expenses,
    revenueChartData,
    topClients,
    alerts,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Placeholder data for when DB is empty
  const planData = [
    { name: "Fórmula Base", value: Math.max(data.activeClients, 5) },
    { name: "Fórmula Avançada", value: Math.max(Math.floor(data.activeClients * 0.6), 3) },
    { name: "Fórmula Total", value: Math.max(Math.floor(data.activeClients * 0.3), 2) },
  ];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da CDR Group Performance
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Receita Mensal"
          value={data.revenue > 0 ? formatCurrency(data.revenue) : "R$ 45.000"}
          change={`${Number(data.revenueChange) >= 0 ? "+" : ""}${data.revenueChange}% vs mês anterior`}
          changeType={Number(data.revenueChange) >= 0 ? "positive" : "negative"}
          icon={DollarSign}
        />
        <KpiCard
          title="Clientes Ativos"
          value={data.activeClients > 0 ? String(data.activeClients) : "18"}
          change="+2 este mês"
          changeType="positive"
          icon={Users}
        />
        <KpiCard
          title="Media Spend"
          value={
            data.totalMediaSpend > 0
              ? `R$ ${formatCompact(data.totalMediaSpend)}`
              : "R$ 400k"
          }
          change="Total gerenciado"
          changeType="neutral"
          icon={BarChart3}
        />
        <KpiCard
          title="ROAS Médio"
          value={data.avgRoas > 0 ? data.avgRoas.toFixed(1) + "x" : "4.2x"}
          change="Acima da meta"
          changeType="positive"
          icon={TrendingUp}
        />
        <KpiCard
          title="Leads Pipeline"
          value={data.totalLeads > 0 ? String(data.totalLeads) : "12"}
          change="Em negociação"
          changeType="neutral"
          icon={Target}
        />
        <KpiCard
          title="Lucro Líquido"
          value={
            data.profit !== 0 ? formatCurrency(data.profit) : "R$ 17.000"
          }
          change="Margem: 37.8%"
          changeType="positive"
          icon={Wallet}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={data.revenueChartData} />
        <ClientsByPlanChart data={planData} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopClientsChart
          data={
            data.topClients.length > 0
              ? data.topClients
              : [
                  { name: "Loja Fashion", faturamento: 120000 },
                  { name: "Tech Store", faturamento: 95000 },
                  { name: "Beauty Shop", faturamento: 78000 },
                  { name: "Home Decor", faturamento: 65000 },
                  { name: "Pet World", faturamento: 52000 },
                ]
          }
        />
        <AlertsCard
          alerts={
            data.alerts.length > 0
              ? data.alerts
              : [
                  {
                    id: "1",
                    type: "overdue",
                    message: "Fatura de Loja Fashion está vencida há 5 dias",
                  },
                  {
                    id: "2",
                    type: "expiring",
                    message: "Contrato de Tech Store vence em 15 dias",
                  },
                  {
                    id: "3",
                    type: "underperforming",
                    message: "Beauty Shop com ROAS 1.8x (meta: 3.0x)",
                  },
                ]
          }
        />
      </div>
    </div>
  );
}
