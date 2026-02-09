import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Service Plans
  const plans = await Promise.all([
    prisma.servicePlan.upsert({
      where: { id: "plan-base" },
      update: {},
      create: {
        id: "plan-base",
        name: "Fórmula Base",
        price: 2500,
        description: "Plano inicial para e-commerces em crescimento",
      },
    }),
    prisma.servicePlan.upsert({
      where: { id: "plan-avancada" },
      update: {},
      create: {
        id: "plan-avancada",
        name: "Fórmula Avançada",
        price: 5000,
        description: "Plano intermediário com estratégias avançadas",
      },
    }),
    prisma.servicePlan.upsert({
      where: { id: "plan-total" },
      update: {},
      create: {
        id: "plan-total",
        name: "Fórmula Total",
        price: 10000,
        description: "Plano completo com gestão full-service",
      },
    }),
  ]);

  // Commission Rules
  await Promise.all([
    prisma.commissionRule.upsert({
      where: { id: "rule-none" },
      update: {},
      create: {
        id: "rule-none",
        name: "Sem Comissão",
        minRoas: 0,
        maxRoas: 3,
        percentage: 0,
      },
    }),
    prisma.commissionRule.upsert({
      where: { id: "rule-level1" },
      update: {},
      create: {
        id: "rule-level1",
        name: "Nível 1",
        minRoas: 3,
        maxRoas: 5,
        percentage: 5,
      },
    }),
    prisma.commissionRule.upsert({
      where: { id: "rule-level2" },
      update: {},
      create: {
        id: "rule-level2",
        name: "Nível 2",
        minRoas: 5,
        maxRoas: 8,
        percentage: 8,
      },
    }),
    prisma.commissionRule.upsert({
      where: { id: "rule-level3" },
      update: {},
      create: {
        id: "rule-level3",
        name: "Nível 3",
        minRoas: 8,
        maxRoas: null,
        percentage: 12,
      },
    }),
  ]);

  // Settings
  const defaultSettings = [
    { key: "agency_name", value: "CDR Group Performance", category: "agency" },
    { key: "agency_cnpj", value: "", category: "agency" },
    {
      key: "pipeline_stages",
      value: JSON.stringify([
        "LEAD_RECEBIDO",
        "PRIMEIRO_CONTATO",
        "REUNIAO_AGENDADA",
        "PROPOSTA_ENVIADA",
        "NEGOCIACAO",
        "FECHADO_GANHO",
        "PERDIDO",
      ]),
      category: "pipeline",
    },
    {
      key: "expense_categories",
      value: JSON.stringify([
        "FERRAMENTAS_SAAS",
        "SALARIOS",
        "COMISSOES",
        "IMPOSTOS",
        "INFRAESTRUTURA",
        "MARKETING",
        "OUTROS",
      ]),
      category: "finance",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("Seed completed!");
  console.log(`- ${plans.length} service plans created`);
  console.log("- 4 commission rules created");
  console.log(`- ${defaultSettings.length} settings created`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
