import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  status: z
    .enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"])
    .default("PENDENTE"),
  isRecurring: z.boolean().default(false),
  recurrence: z
    .enum(["MENSAL", "SEMANAL", "QUINZENAL", "ANUAL", "UNICA"])
    .optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: `FAT-${year}` },
    },
    orderBy: { createdAt: "desc" },
  });

  let nextNumber = 1;
  if (lastInvoice?.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }

  return `FAT-${year}-${String(nextNumber).padStart(3, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { deletedAt: null };

  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      {
        client: {
          companyName: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { id: true, companyName: true } },
    },
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = invoiceSchema.parse(body);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        amount: data.amount,
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        status: data.status,
        isRecurring: data.isRecurring,
        recurrence: data.recurrence || null,
        paidDate: data.status === "PAGO" ? new Date() : null,
      },
      include: {
        client: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar fatura" },
      { status: 500 }
    );
  }
}
