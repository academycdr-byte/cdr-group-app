import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

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
