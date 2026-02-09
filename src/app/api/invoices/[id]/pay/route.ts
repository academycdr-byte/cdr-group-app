import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "PAGO",
        paidDate: new Date(),
      },
    });

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json(
      { error: "Erro ao marcar fatura como paga" },
      { status: 500 }
    );
  }
}
