import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM format

  const where: Record<string, unknown> = {};

  if (month) {
    const [year, m] = month.split("-").map(Number);
    const startOfMonth = new Date(year, m - 1, 1);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59);
    where.month = { gte: startOfMonth, lte: endOfMonth };
  }

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      client: { select: { id: true, companyName: true } },
      teamMember: { select: { id: true, name: true, role: true } },
      rule: { select: { name: true, percentage: true } },
    },
    orderBy: [{ teamMember: { name: "asc" } }, { client: { companyName: "asc" } }],
  });

  return NextResponse.json(commissions);
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { month } = body; // YYYY-MM format

    if (!month) {
      return NextResponse.json(
        { error: "Mês é obrigatório (formato YYYY-MM)" },
        { status: 400 }
      );
    }

    const [year, m] = month.split("-").map(Number);
    const startOfMonth = new Date(year, m - 1, 1);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59);

    // 1. Fetch all metrics for the month
    const metrics = await prisma.clientMetric.findMany({
      where: {
        month: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            trafficManagerId: true,
          },
        },
      },
    });

    // 2. Fetch active commission rules ordered by minRoas
    const rules = await prisma.commissionRule.findMany({
      where: { isActive: true },
      orderBy: { minRoas: "asc" },
    });

    if (rules.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma regra de comissão ativa" },
        { status: 400 }
      );
    }

    // 3. Calculate and upsert commissions
    const results = [];

    for (const metric of metrics) {
      const { client } = metric;
      if (!client.trafficManagerId) continue;

      const roas = Number(metric.roas);
      const revenue = Number(metric.revenue);

      // Find matching rule
      const matchingRule = rules.find((rule) => {
        const min = Number(rule.minRoas);
        const max = rule.maxRoas ? Number(rule.maxRoas) : null;
        return roas >= min && (max === null || roas < max);
      });

      if (!matchingRule) continue;

      const percentage = Number(matchingRule.percentage);
      const amount = (revenue * percentage) / 100;

      const commission = await prisma.commission.upsert({
        where: {
          clientId_teamMemberId_month: {
            clientId: client.id,
            teamMemberId: client.trafficManagerId,
            month: startOfMonth,
          },
        },
        update: {
          roas: metric.roas,
          mediaSpend: metric.mediaSpend,
          revenue: metric.revenue,
          percentage: matchingRule.percentage,
          amount,
          ruleId: matchingRule.id,
        },
        create: {
          clientId: client.id,
          teamMemberId: client.trafficManagerId,
          month: startOfMonth,
          roas: metric.roas,
          mediaSpend: metric.mediaSpend,
          revenue: metric.revenue,
          percentage: matchingRule.percentage,
          amount,
          ruleId: matchingRule.id,
        },
      });

      results.push(commission);
    }

    return NextResponse.json({
      calculated: results.length,
      month,
      commissions: results,
    });
  } catch (error) {
    console.error("Commission calculation error:", error);
    return NextResponse.json(
      { error: "Erro ao calcular comissões" },
      { status: 500 }
    );
  }
}
