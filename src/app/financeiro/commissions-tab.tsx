"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2 } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { toast } from "sonner";

interface CommissionRule {
  id: string;
  name: string;
  minRoas: unknown;
  maxRoas: unknown;
  percentage: unknown;
}

interface CommissionRow {
  id: string;
  month: string;
  roas: unknown;
  mediaSpend: unknown;
  revenue: unknown;
  percentage: unknown;
  amount: unknown;
  client: { id: string; companyName: string };
  teamMember: { id: string; name: string; role: string };
  rule: { name: string; percentage: unknown } | null;
}

interface CommissionsTabProps {
  rules: CommissionRule[];
  commissions: CommissionRow[];
}

export function CommissionsTab({ rules, commissions }: CommissionsTabProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const router = useRouter();

  // Group commissions by team member
  const byMember = commissions.reduce(
    (acc, c) => {
      const key = c.teamMember.id;
      if (!acc[key]) {
        acc[key] = {
          name: c.teamMember.name,
          role: c.teamMember.role,
          items: [],
          total: 0,
        };
      }
      acc[key].items.push(c);
      acc[key].total += Number(c.amount);
      return acc;
    },
    {} as Record<
      string,
      { name: string; role: string; items: CommissionRow[]; total: number }
    >
  );

  const totalCommissions = commissions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  async function handleCalculate() {
    setIsCalculating(true);
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao calcular");
      }

      const result = await res.json();
      toast.success(`${result.calculated} comissões calculadas para ${month}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao calcular comissões"
      );
    }
    setIsCalculating(false);
  }

  const roleLabels: Record<string, string> = {
    TRAFFIC_MANAGER: "Gestor de Tráfego",
    DESIGNER: "Designer",
    CEO: "CEO",
    CS_CX: "CS/CX",
    FINANCEIRO: "Financeiro",
    COMERCIAL: "Comercial",
    ESPECIALISTA_AUTOMACAO: "Automação",
  };

  return (
    <div className="space-y-6">
      {/* Commission Rules */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Regras de Comissão (Tiers ROAS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma regra configurada
            </p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Tier
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      ROAS Mínimo
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      ROAS Máximo
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Comissão
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{Number(rule.minRoas).toFixed(1)}x</TableCell>
                      <TableCell>
                        {rule.maxRoas
                          ? `${Number(rule.maxRoas).toFixed(1)}x`
                          : "Sem limite"}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatPercent(Number(rule.percentage))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculate */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Calcular Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Mês de referência</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="gap-2"
            >
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Calcular
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {commissions.length > 0 && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Comissões do Período
            </CardTitle>
            <span className="text-lg font-bold text-primary">
              Total: {formatCurrency(totalCommissions)}
            </span>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(byMember).map(([memberId, group]) => (
              <div key={memberId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[group.role] || group.role}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(group.total)}
                  </span>
                </div>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                        <TableHead className="text-xs">Faturamento</TableHead>
                        <TableHead className="text-xs">%</TableHead>
                        <TableHead className="text-xs">Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">
                            {c.client.companyName}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {Number(c.roas).toFixed(1)}x
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatCurrency(Number(c.revenue))}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatPercent(Number(c.percentage))}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-primary">
                            {formatCurrency(Number(c.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {commissions.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma comissão calculada. Selecione um mês e clique em Calcular.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
