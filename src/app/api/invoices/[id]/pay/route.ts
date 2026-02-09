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
