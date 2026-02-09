"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, TrendingDown, ListTodo } from "lucide-react";

interface Alert {
  id: string;
  type: "overdue" | "expiring" | "underperforming" | "task";
  message: string;
}

interface AlertsCardProps {
  alerts: Alert[];
}

const alertConfig = {
  overdue: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Fatura",
  },
  expiring: {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    label: "Contrato",
  },
  underperforming: {
    icon: TrendingDown,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "ROAS",
  },
  task: {
    icon: ListTodo,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Tarefa",
  },
};

export function AlertsCard({ alerts }: AlertsCardProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum alerta no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Alertas
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {config.label}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
