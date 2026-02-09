"use client";

import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contactName: z.string().min(1, "Nome do contato é obrigatório"),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  instagram: z.string().optional(),
  website: z.string().optional(),
  ecommercePlatform: z.string().optional().default("SHOPIFY"),
  niche: z.string().optional(),
  status: z.string().optional().default("EM_ONBOARDING"),
  contractStartDate: z.string().optional(),
  contractDurationMonths: z.string().optional(),
  roasTarget: z.string().optional(),
  notes: z.string().optional(),
  planId: z.string().optional(),
  trafficManagerId: z.string().optional(),
  designerId: z.string().optional(),
});

type FormData = z.input<typeof formSchema>;

interface ClientFormProps {
  plans: { id: string; name: string }[];
  trafficManagers: { id: string; name: string }[];
  designers: { id: string; name: string }[];
  defaultValues?: Partial<FormData>;
  clientId?: string;
}

export function ClientForm({
  plans,
  trafficManagers,
  designers,
  defaultValues,
  clientId,
}: ClientFormProps) {
  const router = useRouter();
  const isEditing = !!clientId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ecommercePlatform: "SHOPIFY",
      status: "EM_ONBOARDING",
      ...defaultValues,
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        contractDurationMonths: data.contractDurationMonths
          ? parseInt(data.contractDurationMonths)
          : undefined,
        roasTarget: data.roasTarget ? parseFloat(data.roasTarget) : undefined,
        planId: data.planId || undefined,
        trafficManagerId: data.trafficManagerId || undefined,
        designerId: data.designerId || undefined,
      };

      const url = isEditing ? `/api/clients/${clientId}` : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar");
      }

      toast.success(isEditing ? "Cliente atualizado!" : "Cliente cadastrado!");
      router.push("/clientes");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar cliente"
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados básicos */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input {...register("companyName")} placeholder="Ex: Loja Fashion" />
            {errors.companyName && (
              <p className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label>Nome do Contato *</Label>
            <Input {...register("contactName")} placeholder="Nome do responsável" />
            {errors.contactName && (
              <p className="text-xs text-destructive">
                {errors.contactName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input {...register("phone")} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...register("email")} type="email" placeholder="contato@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input {...register("instagram")} placeholder="@empresa" />
          </div>
          <div className="space-y-2">
            <Label>Site / Loja</Label>
            <Input {...register("website")} placeholder="https://loja.com.br" />
          </div>
          <div className="space-y-2">
            <Label>Nicho</Label>
            <Input {...register("niche")} placeholder="Ex: Moda, Beleza, Pet" />
          </div>
        </CardContent>
      </Card>

      {/* Contrato */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Contrato e Plano</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Plataforma E-commerce</Label>
            <Select
              value={watch("ecommercePlatform")}
              onValueChange={(v) => setValue("ecommercePlatform", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHOPIFY">Shopify</SelectItem>
                <SelectItem value="WOOCOMMERCE">WooCommerce</SelectItem>
                <SelectItem value="NUVEMSHOP">Nuvemshop</SelectItem>
                <SelectItem value="TRAY">Tray</SelectItem>
                <SelectItem value="VTEX">VTEX</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select
              value={watch("planId") || ""}
              onValueChange={(v) => setValue("planId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(v) => setValue("status", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EM_ONBOARDING">Em Onboarding</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="PAUSADO">Pausado</SelectItem>
                <SelectItem value="CHURNED">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Início do Contrato</Label>
            <Input {...register("contractStartDate")} type="date" />
          </div>
          <div className="space-y-2">
            <Label>Duração (meses)</Label>
            <Input
              {...register("contractDurationMonths")}
              type="number"
              placeholder="12"
            />
          </div>
          <div className="space-y-2">
            <Label>Meta ROAS</Label>
            <Input
              {...register("roasTarget")}
              type="number"
              step="0.1"
              placeholder="3.0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipe */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Equipe Responsável</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Gestor de Tráfego</Label>
            <Select
              value={watch("trafficManagerId") || ""}
              onValueChange={(v) => setValue("trafficManagerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {trafficManagers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Designer</Label>
            <Select
              value={watch("designerId") || ""}
              onValueChange={(v) => setValue("designerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {designers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notes")}
            placeholder="Notas sobre o cliente..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" className="font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : isEditing ? (
            "Salvar Alterações"
          ) : (
            "Cadastrar Cliente"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
