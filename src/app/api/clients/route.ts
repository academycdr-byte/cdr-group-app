import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";

const clientSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contactName: z.string().min(1, "Nome do contato é obrigatório"),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  instagram: z.string().optional(),
  website: z.string().optional(),
  ecommercePlatform: z.enum([
    "SHOPIFY", "WOOCOMMERCE", "NUVEMSHOP", "TRAY", "VTEX", "OUTRO",
  ]).default("SHOPIFY"),
  niche: z.string().optional(),
  status: z.enum(["ATIVO", "PAUSADO", "CHURNED", "EM_ONBOARDING"]).default("EM_ONBOARDING"),
  contractStartDate: z.string().optional(),
  contractDurationMonths: z.number().optional(),
  roasTarget: z.number().optional(),
  notes: z.string().optional(),
  planId: z.string().optional(),
  trafficManagerId: z.string().optional(),
  designerId: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const planId = searchParams.get("planId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { deletedAt: null };

  if (status) where.status = status;
  if (planId) where.planId = planId;
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { niche: { contains: search, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      plan: { select: { name: true } },
      trafficManager: { select: { name: true } },
      designer: { select: { name: true } },
      _count: { select: { invoices: true, metrics: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const data = clientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || null,
        contractStartDate: data.contractStartDate
          ? new Date(data.contractStartDate)
          : null,
        roasTarget: data.roasTarget || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
