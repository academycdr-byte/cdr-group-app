import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        status: "PAGO",
        paidDate: new Date(),
      },
    });

    return NextResponse.json(expense);
  } catch {
    return NextResponse.json(
      { error: "Erro ao marcar despesa como paga" },
      { status: 500 }
    );
  }
}
