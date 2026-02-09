export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClientForm } from "../client-form";

export default async function NovoClientePage() {
  const profile = await getAuthUser();

  const [plans, teamMembers] = await Promise.all([
    prisma.servicePlan.findMany({ where: { isActive: true } }),
    prisma.teamMember.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, role: true },
    }),
  ]);

  const trafficManagers = teamMembers.filter(
    (m) => m.role === "TRAFFIC_MANAGER" || m.role === "CEO"
  );
  const designers = teamMembers.filter(
    (m) => m.role === "DESIGNER" || m.role === "CEO"
  );

  return (
    <DashboardShell userName={profile.name} userEmail={profile.email}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo cliente no sistema
          </p>
        </div>
        <ClientForm
          plans={plans}
          trafficManagers={trafficManagers}
          designers={designers}
        />
      </div>
    </DashboardShell>
  );
}
