import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";

const updateSchema = z.object({
  clientId: z.string().optional(),
  amount: z.number().min(0.01).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]).optional(),
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
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, companyName: true } },
    },
  });

  if (!invoice || invoice.deletedAt) {
    return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

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

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar fatura" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  await prisma.invoice.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
