"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCurrency } from "@/lib/format";
import { CashFlowChart, ExpenseBreakdownChart } from "./financial-charts";
import { InvoicesTable } from "./invoices-table";
import { ExpensesTable } from "./expenses-table";
import { CommissionsTab } from "./commissions-tab";

interface FinancialData {
  kpis: {
    revenue: number;
    expenses: number;
    profit: number;
    overdueCount: number;
    overdueAmount: number;
  };
  cashFlowData: { month: string; receita: number; despesas: number }[];
  expenseBreakdown: { name: string; value: number }[];
  invoices: Array<{
    id: string;
    invoiceNumber: string | null;
    amount: unknown;
    status: string;
    dueDate: string;
    paidDate: string | null;
    description: string | null;
    isRecurring: boolean;
    recurrence: string | null;
    client: { id: string; companyName: string };
  }>;
  expenses: Array<{
    id: string;
    description: string;
    amount: unknown;
    category: string;
    status: string;
    dueDate: string;
    paidDate: string | null;
    isRecurring: boolean;
    recurrence: string | null;
  }>;
  clients: { id: string; companyName: string }[];
  commissionRules: Array<{
    id: string;
    name: string;
    minRoas: unknown;
    maxRoas: unknown;
    percentage: unknown;
  }>;
  commissions: Array<{
    id: string;
    month: string;
    roas: unknown;
    mediaSpend: unknown;
    revenue: unknown;
    percentage: unknown;
    amount: unknown;
    client: { id: string; companyName: string };
    teamMember: { id: string; name: string; role: string };
    rule: { name: string; percentage: unknown } | null;
  }>;
}

interface FinancialTabsProps {
  data: FinancialData;
}

export function FinancialTabs({ data }: FinancialTabsProps) {
  const { kpis } = data;

  return (
    <Tabs defaultValue="visao-geral" className="space-y-6">
      <TabsList>
        <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
        <TabsTrigger value="faturas">Faturas</TabsTrigger>
        <TabsTrigger value="despesas">Despesas</TabsTrigger>
        <TabsTrigger value="comissoes">Comissões</TabsTrigger>
      </TabsList>

      {/* Visão Geral */}
      <TabsContent value="visao-geral" className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Receita Mensal"
            value={formatCurrency(kpis.revenue)}
            change="Faturas pagas este mês"
            changeType="positive"
            icon={DollarSign}
          />
          <KpiCard
            title="Despesas Mensais"
            value={formatCurrency(kpis.expenses)}
            change="Despesas pagas este mês"
            changeType="negative"
            icon={TrendingDown}
          />
          <KpiCard
            title="Lucro Líquido"
            value={formatCurrency(kpis.profit)}
            change={
              kpis.revenue > 0
                ? `Margem: ${((kpis.profit / kpis.revenue) * 100).toFixed(1)}%`
                : "Sem receita"
            }
            changeType={kpis.profit >= 0 ? "positive" : "negative"}
            icon={Wallet}
          />
          <KpiCard
            title="Faturas Atrasadas"
            value={String(kpis.overdueCount)}
            change={
              kpis.overdueAmount > 0
                ? formatCurrency(kpis.overdueAmount)
                : "Nenhuma atrasada"
            }
            changeType={kpis.overdueCount > 0 ? "negative" : "positive"}
            icon={AlertTriangle}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CashFlowChart data={data.cashFlowData} />
          <ExpenseBreakdownChart data={data.expenseBreakdown} />
        </div>

        {/* Recent invoices & expenses */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-border">
            <div className="p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Faturas Recentes
              </h3>
            </div>
            <CardContent className="pt-0">
              {data.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma fatura</p>
              ) : (
                <div className="space-y-2">
                  {data.invoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {inv.client.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.invoiceNumber} &middot; Venc:{" "}
                          {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(Number(inv.amount))}
                        </p>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <div className="p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Despesas Recentes
              </h3>
            </div>
            <CardContent className="pt-0">
              {data.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa</p>
              ) : (
                <div className="space-y-2">
                  {data.expenses.slice(0, 5).map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Venc:{" "}
                          {new Date(exp.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(Number(exp.amount))}
                        </p>
                        <StatusBadge status={exp.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Faturas */}
      <TabsContent value="faturas" className="space-y-4">
        <InvoicesTable invoices={data.invoices} clients={data.clients} />
      </TabsContent>

      {/* Despesas */}
      <TabsContent value="despesas" className="space-y-4">
        <ExpensesTable expenses={data.expenses} />
      </TabsContent>

      {/* Comissões */}
      <TabsContent value="comissoes">
        <CommissionsTab
          rules={data.commissionRules}
          commissions={data.commissions}
        />
      </TabsContent>
    </Tabs>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDENTE: {
      label: "Pendente",
      className: "bg-yellow-500/10 text-yellow-500",
    },
    PAGO: { label: "Pago", className: "bg-primary/10 text-primary" },
    ATRASADO: {
      label: "Atrasado",
      className: "bg-destructive/10 text-destructive",
    },
    CANCELADO: {
      label: "Cancelado",
      className: "bg-muted text-muted-foreground",
    },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${c.className}`}
    >
      {c.label}
    </span>
  );
}
