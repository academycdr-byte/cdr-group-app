"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: string }> = {
  ATIVO: { label: "Ativo", variant: "bg-primary/10 text-primary" },
  PAUSADO: { label: "Pausado", variant: "bg-yellow-500/10 text-yellow-500" },
  CHURNED: { label: "Churned", variant: "bg-destructive/10 text-destructive" },
  EM_ONBOARDING: { label: "Onboarding", variant: "bg-blue-500/10 text-blue-500" },
};

interface ClientRow {
  id: string;
  companyName: string;
  contactName: string;
  status: string;
  niche: string | null;
  plan: { name: string } | null;
  trafficManager: { name: string } | null;
  latestMetric: {
    roas: unknown;
    mediaSpend: unknown;
    revenue: unknown;
  } | null;
}

interface ClientsTableProps {
  clients: ClientRow[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
      toast.success("Cliente removido com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao remover cliente");
    }
    setDeleteId(null);
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="PAUSADO">Pausado</SelectItem>
            <SelectItem value="CHURNED">Churned</SelectItem>
            <SelectItem value="EM_ONBOARDING">Onboarding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Empresa
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Plano
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Gestor
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                ROAS
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Nicho
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "Nenhum cliente encontrado com os filtros aplicados"
                      : "Nenhum cliente cadastrado ainda"}
                  </p>
                  {!search && statusFilter === "all" && (
                    <Link href="/clientes/novo">
                      <Button variant="outline" className="mt-4">
                        Cadastrar primeiro cliente
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => {
                const status = statusConfig[client.status];
                const roas = client.latestMetric
                  ? Number(client.latestMetric.roas)
                  : null;
                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => router.push(`/clientes/${client.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {client.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.contactName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
                          status?.variant
                        )}
                      >
                        {status?.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.plan?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.trafficManager?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {roas !== null ? (
                        <span
                          className={cn(
                            "font-semibold",
                            roas >= 5
                              ? "text-primary"
                              : roas >= 3
                                ? "text-yellow-500"
                                : "text-destructive"
                          )}
                        >
                          {roas.toFixed(1)}x
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.niche || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clientes/${client.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/clientes/${client.id}/editar`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(client.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
