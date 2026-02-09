"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  isRecurring: z.boolean().default(false),
  recurrence: z.string().optional(),
});

type FormData = z.input<typeof formSchema>;

const CATEGORIES = [
  { value: "FERRAMENTAS_SAAS", label: "Ferramentas / SaaS" },
  { value: "SALARIOS", label: "Salários" },
  { value: "COMISSOES", label: "Comissões" },
  { value: "IMPOSTOS", label: "Impostos" },
  { value: "INFRAESTRUTURA", label: "Infraestrutura" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OUTROS", label: "Outros" },
];

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    id?: string;
    description?: string;
    amount?: string;
    category?: string;
    dueDate?: string;
    isRecurring?: boolean;
    recurrence?: string;
  };
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: ExpenseFormProps) {
  const isEditing = !!defaultValues?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: defaultValues?.description || "",
      amount: defaultValues?.amount || "",
      category: defaultValues?.category || "OUTROS",
      dueDate: defaultValues?.dueDate || "",
      isRecurring: defaultValues?.isRecurring || false,
      recurrence: defaultValues?.recurrence || "",
    },
  });

  const isRecurring = watch("isRecurring");

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        dueDate: data.dueDate,
        isRecurring: data.isRecurring,
        recurrence: data.isRecurring ? data.recurrence || undefined : undefined,
      };

      const url = isEditing
        ? `/api/expenses/${defaultValues!.id}`
        : "/api/expenses";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      toast.success(isEditing ? "Despesa atualizada!" : "Despesa criada!");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar despesa"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea
              {...register("description")}
              placeholder="Descrição da despesa..."
              rows={2}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                {...register("amount")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={watch("category")}
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vencimento *</Label>
            <Input {...register("dueDate")} type="date" />
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isRecurring}
              onCheckedChange={(v) => setValue("isRecurring", v)}
            />
            <Label>Despesa recorrente</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>Recorrência</Label>
              <Select
                value={watch("recurrence") || ""}
                onValueChange={(v) => setValue("recurrence", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                  <SelectItem value="ANUAL">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar"
              ) : (
                "Criar Despesa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
