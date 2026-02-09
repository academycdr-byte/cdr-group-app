import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  description: z.string().optional(),
  amount: z.number().min(0.01).optional(),
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
    .optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO"]).optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .enum(["MENSAL", "SEMANAL", "QUINZENAL", "ANUAL", "UNICA"])
    .optional()
    .nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const expense = await prisma.expense.findUnique({
    where: { id: params.id },
  });

  if (!expense || expense.deletedAt) {
    return NextResponse.json(
      { error: "Despesa não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(expense);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }
    if (data.status === "PAGO") {
      updateData.paidDate = new Date();
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar despesa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.expense.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
