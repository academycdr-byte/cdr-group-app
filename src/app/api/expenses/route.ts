import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const expenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  category: z
    .enum([
      "FERRAMENTAS_SAAS",
      "SALARIOS",
      "COMISSOES",
      "IMPOSTOS",
      "INFRAESTRUTURA",
      "MARKETING",
      "OUTROS",
    ])
    .default("OUTROS"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO"]).default("PENDENTE"),
  isRecurring: z.boolean().default(false),
  recurrence: z
    .enum(["MENSAL", "SEMANAL", "QUINZENAL", "ANUAL", "UNICA"])
    .optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { deletedAt: null };

  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.description = { contains: search, mode: "insensitive" };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        dueDate: new Date(data.dueDate),
        status: data.status,
        isRecurring: data.isRecurring,
        recurrence: data.recurrence || null,
        paidDate: data.status === "PAGO" ? new Date() : null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar despesa" },
      { status: 500 }
    );
  }
}
