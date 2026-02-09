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
import { ExpenseFormDialog } from "./expense-form";

const statusConfig: Record<string, { label: string; variant: string }> = {
  PENDENTE: { label: "Pendente", variant: "bg-yellow-500/10 text-yellow-500" },
  PAGO: { label: "Pago", variant: "bg-primary/10 text-primary" },
  ATRASADO: { label: "Atrasado", variant: "bg-destructive/10 text-destructive" },
};

const categoryConfig: Record<string, { label: string; variant: string }> = {
  FERRAMENTAS_SAAS: { label: "SaaS", variant: "bg-cyan-500/10 text-cyan-500" },
  SALARIOS: { label: "Salários", variant: "bg-blue-500/10 text-blue-500" },
  COMISSOES: { label: "Comissões", variant: "bg-purple-500/10 text-purple-500" },
  IMPOSTOS: { label: "Impostos", variant: "bg-red-500/10 text-red-500" },
  INFRAESTRUTURA: { label: "Infra", variant: "bg-orange-500/10 text-orange-500" },
  MARKETING: { label: "Marketing", variant: "bg-primary/10 text-primary" },
  OUTROS: { label: "Outros", variant: "bg-muted text-muted-foreground" },
};

interface ExpenseRow {
  id: string;
  description: string;
  amount: unknown;
  category: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  isRecurring: boolean;
  recurrence: string | null;
}

interface ExpensesTableProps {
  expenses: ExpenseRow[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<ExpenseRow | null>(null);
  const router = useRouter();

  const filtered = expenses.filter((exp) => {
    const matchesSearch = exp.description
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || exp.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || exp.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/expenses/${deleteId}`, { method: "DELETE" });
      toast.success("Despesa removida");
      router.refresh();
    } catch {
      toast.error("Erro ao remover despesa");
    }
    setDeleteId(null);
  }

  async function handleMarkPaid(id: string) {
    try {
      await fetch(`/api/expenses/${id}/pay`, { method: "POST" });
      toast.success("Despesa marcada como paga");
      router.refresh();
    } catch {
      toast.error("Erro ao marcar despesa como paga");
    }
  }

  function handleEdit(exp: ExpenseRow) {
    setEditData(exp);
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
              placeholder="Buscar despesa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="FERRAMENTAS_SAAS">SaaS</SelectItem>
              <SelectItem value="SALARIOS">Salários</SelectItem>
              <SelectItem value="COMISSOES">Comissões</SelectItem>
              <SelectItem value="IMPOSTOS">Impostos</SelectItem>
              <SelectItem value="INFRAESTRUTURA">Infra</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="OUTROS">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2 font-semibold" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Descrição
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Categoria
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
                    {search || statusFilter !== "all" || categoryFilter !== "all"
                      ? "Nenhuma despesa encontrada"
                      : "Nenhuma despesa cadastrada"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((exp) => {
                const status = statusConfig[exp.status];
                const category = categoryConfig[exp.category];
                return (
                  <TableRow
                    key={exp.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="max-w-[250px]">
                      <p className="truncate font-medium">{exp.description}</p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
                          category?.variant
                        )}
                      >
                        {category?.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(exp.amount))}
                    </TableCell>
                    <TableCell>
                      {new Date(exp.dueDate).toLocaleDateString("pt-BR")}
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
                      {exp.isRecurring ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          {exp.recurrence || "Sim"}
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
                          {exp.status !== "PAGO" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkPaid(exp.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(exp)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(exp.id)}
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

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => router.refresh()}
        defaultValues={
          editData
            ? {
                id: editData.id,
                description: editData.description,
                amount: String(Number(editData.amount)),
                category: editData.category,
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
            <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A despesa será removida do sistema.
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
