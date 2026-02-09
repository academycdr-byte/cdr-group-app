import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";

const updateClientSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  instagram: z.string().optional(),
  website: z.string().optional(),
  ecommercePlatform: z
    .enum(["SHOPIFY", "WOOCOMMERCE", "NUVEMSHOP", "TRAY", "VTEX", "OUTRO"])
    .optional(),
  niche: z.string().optional(),
  status: z
    .enum(["ATIVO", "PAUSADO", "CHURNED", "EM_ONBOARDING"])
    .optional(),
  contractStartDate: z.string().optional(),
  contractDurationMonths: z.number().optional(),
  roasTarget: z.number().optional(),
  notes: z.string().optional(),
  planId: z.string().optional(),
  trafficManagerId: z.string().optional(),
  designerId: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      plan: true,
      trafficManager: true,
      designer: true,
      metrics: { orderBy: { month: "desc" }, take: 12 },
      invoices: { where: { deletedAt: null }, orderBy: { dueDate: "desc" }, take: 10 },
      interactions: { orderBy: { createdAt: "desc" }, take: 20 },
      tasks: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!client || client.deletedAt) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const data = updateClientSchema.parse(body);

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...data,
        email: data.email || null,
        contractStartDate: data.contractStartDate
          ? new Date(data.contractStartDate)
          : undefined,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
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

  await prisma.client.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
