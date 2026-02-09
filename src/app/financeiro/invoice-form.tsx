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
  clientId: z.string().min(1, "Selecione um cliente"),
  amount: z.string().min(1, "Valor é obrigatório"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  isRecurring: z.boolean().default(false),
  recurrence: z.string().optional(),
});

type FormData = z.input<typeof formSchema>;

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: { id: string; companyName: string }[];
  onSuccess: () => void;
  defaultValues?: {
    id?: string;
    clientId?: string;
    amount?: string;
    description?: string;
    dueDate?: string;
    isRecurring?: boolean;
    recurrence?: string;
  };
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  clients,
  onSuccess,
  defaultValues,
}: InvoiceFormProps) {
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
      clientId: defaultValues?.clientId || "",
      amount: defaultValues?.amount || "",
      description: defaultValues?.description || "",
      dueDate: defaultValues?.dueDate || "",
      isRecurring: defaultValues?.isRecurring || false,
      recurrence: defaultValues?.recurrence || "",
    },
  });

  const isRecurring = watch("isRecurring");

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        clientId: data.clientId,
        amount: parseFloat(data.amount),
        description: data.description || undefined,
        dueDate: data.dueDate,
        isRecurring: data.isRecurring,
        recurrence: data.isRecurring ? data.recurrence || undefined : undefined,
      };

      const url = isEditing
        ? `/api/invoices/${defaultValues!.id}`
        : "/api/invoices";
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

      toast.success(isEditing ? "Fatura atualizada!" : "Fatura criada!");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar fatura"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Fatura" : "Nova Fatura"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={watch("clientId")}
              onValueChange={(v) => setValue("clientId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-xs text-destructive">{errors.clientId.message}</p>
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
              <Label>Vencimento *</Label>
              <Input {...register("dueDate")} type="date" />
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              {...register("description")}
              placeholder="Descrição da fatura..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isRecurring}
              onCheckedChange={(v) => setValue("isRecurring", v)}
            />
            <Label>Fatura recorrente</Label>
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
                "Criar Fatura"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
