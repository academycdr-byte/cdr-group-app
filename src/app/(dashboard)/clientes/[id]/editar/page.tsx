export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "../../client-form";

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const [client, plans, teamMembers] = await Promise.all([
    prisma.client.findUnique({ where: { id: params.id } }),
    prisma.servicePlan.findMany({ where: { isActive: true } }),
    prisma.teamMember.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, role: true },
    }),
  ]);

  if (!client || client.deletedAt) notFound();

  const trafficManagers = teamMembers.filter(
    (m) => m.role === "TRAFFIC_MANAGER" || m.role === "CEO"
  );
  const designers = teamMembers.filter(
    (m) => m.role === "DESIGNER" || m.role === "CEO"
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar Cliente</h1>
        <p className="text-sm text-muted-foreground">{client.companyName}</p>
      </div>

      <ClientForm
        plans={plans}
        trafficManagers={trafficManagers}
        designers={designers}
        clientId={client.id}
        defaultValues={{
          companyName: client.companyName,
          contactName: client.contactName,
          cnpj: client.cnpj || "",
          phone: client.phone || "",
          email: client.email || "",
          instagram: client.instagram || "",
          website: client.website || "",
          ecommercePlatform: client.ecommercePlatform,
          niche: client.niche || "",
          status: client.status,
          contractStartDate: client.contractStartDate
            ? client.contractStartDate.toISOString().split("T")[0]
            : "",
          contractDurationMonths: client.contractDurationMonths?.toString() || "",
          roasTarget: client.roasTarget?.toString() || "",
          notes: client.notes || "",
          planId: client.planId || "",
          trafficManagerId: client.trafficManagerId || "",
          designerId: client.designerId || "",
        }}
      />
    </div>
  );
}
