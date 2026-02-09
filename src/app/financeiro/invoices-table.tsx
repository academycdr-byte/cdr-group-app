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
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { InvoiceFormDialog } from "./invoice-form";

const statusConfig: Record<string, { label: string; variant: string }> = {
  PENDENTE: { label: "Pendente", variant: "bg-yellow-500/10 text-yellow-500" },
  PAGO: { label: "Pago", variant: "bg-primary/10 text-primary" },
  ATRASADO: { label: "Atrasado", variant: "bg-destructive/10 text-destructive" },
  CANCELADO: { label: "Cancelado", variant: "bg-muted text-muted-foreground" },
};

interface InvoiceRow {
  id: string;
  invoiceNumber: string | null;
  amount: unknown;
  status: string;
  dueDate: string;
  paidDate: string | null;
  description: string | null;
  isRecurring: boolean;
  recurrence: string | null;
  client: { id: string; companyName: string };
}

interface InvoicesTableProps {
  invoices: InvoiceRow[];
  clients: { id: string; companyName: string }[];
}

export function InvoicesTable({ invoices, clients }: InvoicesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<InvoiceRow | null>(null);
  const router = useRouter();

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      inv.client.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/invoices/${deleteId}`, { method: "DELETE" });
      toast.success("Fatura removida");
      router.refresh();
    } catch {
      toast.error("Erro ao remover fatura");
    }
    setDeleteId(null);
  }

  async function handleMarkPaid(id: string) {
    try {
      await fetch(`/api/invoices/${id}/pay`, { method: "POST" });
      toast.success("Fatura marcada como paga");
      router.refresh();
    } catch {
      toast.error("Erro ao marcar fatura como paga");
    }
  }

  function handleEdit(inv: InvoiceRow) {
    setEditData(inv);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditData(null);
    setFormOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar fatura..."
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
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2 font-semibold" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova Fatura
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                N. Fatura
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Cliente
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Valor
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Vencimento
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Recorrente
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
                      ? "Nenhuma fatura encontrada"
                      : "Nenhuma fatura cadastrada"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const status = statusConfig[inv.status];
                return (
                  <TableRow
                    key={inv.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {inv.invoiceNumber || "—"}
                    </TableCell>
                    <TableCell>{inv.client.companyName}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(inv.amount))}
                    </TableCell>
                    <TableCell>
                      {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
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
                    <TableCell>
                      {inv.isRecurring ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          {inv.recurrence || "Sim"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {inv.status !== "PAGO" && inv.status !== "CANCELADO" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkPaid(inv.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(inv)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(inv.id)}
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

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={clients}
        onSuccess={() => router.refresh()}
        defaultValues={
          editData
            ? {
                id: editData.id,
                clientId: editData.client.id,
                amount: String(Number(editData.amount)),
                description: editData.description || "",
                dueDate: editData.dueDate
                  ? new Date(editData.dueDate).toISOString().split("T")[0]
                  : "",
                isRecurring: editData.isRecurring,
                recurrence: editData.recurrence || "",
              }
            : undefined
        }
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover fatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A fatura será removida do sistema.
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
