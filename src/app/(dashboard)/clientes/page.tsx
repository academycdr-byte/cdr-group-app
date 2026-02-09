export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "./clients-table";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    include: {
      plan: { select: { name: true } },
      trafficManager: { select: { name: true } },
      _count: { select: { metrics: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get latest metric for each client
  const clientsWithMetrics = await Promise.all(
    clients.map(async (client) => {
      const latestMetric = await prisma.clientMetric.findFirst({
        where: { clientId: client.id },
        orderBy: { month: "desc" },
      });
      return { ...client, latestMetric };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} clientes cadastrados
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button className="gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <ClientsTable clients={clientsWithMetrics} />
    </div>
  );
}
