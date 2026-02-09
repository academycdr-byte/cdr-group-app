export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FinancialTabs } from "./financial-tabs";

const CATEGORY_LABELS: Record<string, string> = {
  FERRAMENTAS_SAAS: "SaaS",
  SALARIOS: "Salários",
  COMISSOES: "Comissões",
  IMPOSTOS: "Impostos",
  INFRAESTRUTURA: "Infra",
  MARKETING: "Marketing",
  OUTROS: "Outros",
};

async function getFinancialData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Generate last 6 months for cash flow
  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    months.push({
      start: d,
      end,
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
    });
  }

  const [
    paidInvoicesThisMonth,
    paidExpensesThisMonth,
    overdueInvoices,
    allInvoices,
    allExpenses,
    expensesByCategory,
    commissionRules,
    commissions,
    clients,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        status: "PAGO",
        paidDate: { gte: startOfMonth },
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
    prisma.invoice.findMany({
      where: { status: "ATRASADO", deletedAt: null },
      select: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { client: { select: { id: true, companyName: true } } },
      orderBy: { dueDate: "desc" },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null },
      orderBy: { dueDate: "desc" },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { deletedAt: null, status: "PAGO" },
      _sum: { amount: true },
    }),
    prisma.commissionRule.findMany({
      where: { isActive: true },
      orderBy: { minRoas: "asc" },
    }),
    prisma.commission.findMany({
      include: {
        client: { select: { id: true, companyName: true } },
        teamMember: { select: { id: true, name: true, role: true } },
        rule: { select: { name: true, percentage: true } },
      },
      orderBy: [
        { month: "desc" },
        { teamMember: { name: "asc" } },
      ],
      take: 50,
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  // Build cash flow data (last 6 months)
  const cashFlowPromises = months.map(async (m) => {
    const [rev, exp] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: "PAGO",
          paidDate: { gte: m.start, lte: m.end },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          status: "PAGO",
          paidDate: { gte: m.start, lte: m.end },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
    ]);
    return {
      month: m.label,
      receita: Number(rev._sum.amount || 0),
      despesas: Number(exp._sum.amount || 0),
    };
  });

  const cashFlowData = await Promise.all(cashFlowPromises);

  const revenue = Number(paidInvoicesThisMonth._sum.amount || 0);
  const expenses = Number(paidExpensesThisMonth._sum.amount || 0);
  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount),
    0
  );

  const expenseBreakdown = expensesByCategory.map((g) => ({
    name: CATEGORY_LABELS[g.category] || g.category,
    value: Number(g._sum.amount || 0),
  }));

  // Serialize Prisma objects for client component (Date -> string, Decimal -> number)
  const serializedInvoices = allInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    amount: Number(inv.amount),
    status: inv.status,
    dueDate: inv.dueDate.toISOString(),
    paidDate: inv.paidDate?.toISOString() || null,
    description: inv.description,
    isRecurring: inv.isRecurring,
    recurrence: inv.recurrence,
    client: inv.client,
  }));

  const serializedExpenses = allExpenses.map((exp) => ({
    id: exp.id,
    description: exp.description,
    amount: Number(exp.amount),
    category: exp.category,
    status: exp.status,
    dueDate: exp.dueDate.toISOString(),
    paidDate: exp.paidDate?.toISOString() || null,
    isRecurring: exp.isRecurring,
    recurrence: exp.recurrence,
  }));

  const serializedRules = commissionRules.map((r) => ({
    id: r.id,
    name: r.name,
    minRoas: Number(r.minRoas),
    maxRoas: r.maxRoas ? Number(r.maxRoas) : null,
    percentage: Number(r.percentage),
  }));

  const serializedCommissions = commissions.map((c) => ({
    id: c.id,
    month: c.month.toISOString(),
    roas: Number(c.roas),
    mediaSpend: Number(c.mediaSpend),
    revenue: Number(c.revenue),
    percentage: Number(c.percentage),
    amount: Number(c.amount),
    client: c.client,
    teamMember: c.teamMember,
    rule: c.rule
      ? { name: c.rule.name, percentage: Number(c.rule.percentage) }
      : null,
  }));

  return {
    kpis: {
      revenue,
      expenses,
      profit: revenue - expenses,
      overdueCount: overdueInvoices.length,
      overdueAmount,
    },
    cashFlowData,
    expenseBreakdown,
    invoices: serializedInvoices,
    expenses: serializedExpenses,
    clients,
    commissionRules: serializedRules,
    commissions: serializedCommissions,
  };
}

export default async function FinanceiroPage() {
  const profile = await getAuthUser();
  const data = await getFinancialData();

  return (
    <DashboardShell userName={profile.name} userEmail={profile.email}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Gestão financeira da agência
          </p>
        </div>
        <FinancialTabs data={data} />
      </div>
    </DashboardShell>
  );
}
