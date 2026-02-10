import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Test 1: Basic connection
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    checks.connection = "ok";
  } catch (error) {
    checks.connection = error instanceof Error ? error.message : String(error);
    return NextResponse.json(checks, { status: 500 });
  }

  // Test 2: User table
  try {
    const count = await prisma.user.count();
    checks.users = { status: "ok", count };
  } catch (error) {
    checks.users = { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  // Test 3: Client table
  try {
    const count = await prisma.client.count({ where: { deletedAt: null } });
    checks.clients = { status: "ok", count };
  } catch (error) {
    checks.clients = { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  // Test 4: Lead table
  try {
    const count = await prisma.lead.count({ where: { deletedAt: null } });
    checks.leads = { status: "ok", count };
  } catch (error) {
    checks.leads = { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  // Test 5: Invoice table
  try {
    const count = await prisma.invoice.count({ where: { deletedAt: null } });
    checks.invoices = { status: "ok", count };
  } catch (error) {
    checks.invoices = { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  // Test 6: Expense table
  try {
    const count = await prisma.expense.count({ where: { deletedAt: null } });
    checks.expenses = { status: "ok", count };
  } catch (error) {
    checks.expenses = { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  // Test 7: ClientMetric table
  try {
    const count = await prisma.clientMetric.count();
    checks.clientMetrics = { status: "ok", count };
  } catch (error) {
    checks.clientMetrics = { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  const hasError = Object.values(checks).some(
    (v) => typeof v === "object" && v !== null && "status" in v && (v as { status: string }).status === "error"
  );

  return NextResponse.json(checks, { status: hasError ? 500 : 200 });
}
