export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Pencil,
  Globe,
  Instagram,
  Phone,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { ClientMetricsChart } from "./metrics-chart";

const statusConfig: Record<string, { label: string; class: string }> = {
  ATIVO: { label: "Ativo", class: "bg-primary/10 text-primary" },
  PAUSADO: { label: "Pausado", class: "bg-yellow-500/10 text-yellow-500" },
  CHURNED: { label: "Churned", class: "bg-destructive/10 text-destructive" },
  EM_ONBOARDING: { label: "Onboarding", class: "bg-blue-500/10 text-blue-500" },
};

export default async function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      plan: true,
      trafficManager: true,
      designer: true,
      metrics: { orderBy: { month: "desc" }, take: 12 },
      invoices: { where: { deletedAt: null }, orderBy: { dueDate: "desc" }, take: 5 },
      interactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!client || client.deletedAt) notFound();

  const latestMetric = client.metrics[0];
  const previousMetric = client.metrics[1];
  const status = statusConfig[client.status];

  // Contract countdown
  let daysRemaining: number | null = null;
  if (client.contractStartDate && client.contractDurationMonths) {
    const endDate = new Date(client.contractStartDate);
    endDate.setMonth(endDate.getMonth() + client.contractDurationMonths);
    daysRemaining = Math.ceil(
      (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  function variation(current: number, previous: number): string {
    if (previous === 0) return "—";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {client.companyName}
              </h1>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${status?.class}`}>
                {status?.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {client.contactName} &middot; {client.niche || "Sem nicho"}
            </p>
          </div>
        </div>
        <Link href={`/clientes/${client.id}/editar`}>
          <Button variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ROAS Atual
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">
              {latestMetric ? `${Number(latestMetric.roas).toFixed(1)}x` : "—"}
            </p>
            {latestMetric && previousMetric && (
              <p className="text-xs text-muted-foreground">
                {variation(Number(latestMetric.roas), Number(previousMetric.roas))} vs mês anterior
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Media Spend
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">
              {latestMetric
                ? formatCurrency(Number(latestMetric.mediaSpend))
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Faturamento
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">
              {latestMetric
                ? formatCurrency(Number(latestMetric.revenue))
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contrato
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">
              {daysRemaining !== null
                ? `${daysRemaining}d`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {daysRemaining !== null && daysRemaining > 0
                ? "dias restantes"
                : daysRemaining !== null
                  ? "expirado"
                  : "sem contrato"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Details */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.instagram && (
                <div className="flex items-center gap-2 text-sm">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span>{client.instagram}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              )}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium">{client.plan?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plataforma</span>
                  <span className="font-medium">{client.ecommercePlatform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gestor</span>
                  <span className="font-medium">
                    {client.trafficManager?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designer</span>
                  <span className="font-medium">
                    {client.designer?.name || "—"}
                  </span>
                </div>
                {client.roasTarget && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meta ROAS</span>
                    <span className="font-medium">
                      {Number(client.roasTarget).toFixed(1)}x
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Faturas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma fatura</p>
              ) : (
                <div className="space-y-2">
                  {client.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(inv.amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venc: {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          inv.status === "PAGO"
                            ? "default"
                            : inv.status === "ATRASADO"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Metrics & Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metrics Chart */}
          <ClientMetricsChart
            metrics={client.metrics.reverse().map((m) => ({
              month: new Date(m.month).toLocaleDateString("pt-BR", {
                month: "short",
                year: "2-digit",
              }),
              roas: Number(m.roas),
              mediaSpend: Number(m.mediaSpend),
              revenue: Number(m.revenue),
            }))}
          />

          {/* Interaction Timeline */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma interação registrada
                </p>
              ) : (
                <div className="space-y-4">
                  {client.interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="flex gap-3 border-l-2 border-border pl-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {interaction.type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {interaction.content}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(interaction.createdAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {client.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
