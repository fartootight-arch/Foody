import { prisma } from "@/lib/prisma";
import { BudgetClient } from "./BudgetClient";

export const dynamic = "force-dynamic";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const now = new Date();
  const { month: monthStr, year: yearStr } = await searchParams;
  const month = Number(monthStr ?? now.getMonth() + 1);
  const year = Number(yearStr ?? now.getFullYear());

  // Fetch or create budget config
  let config = await prisma.budgetConfig.findFirst({ where: { month, year } });
  if (!config) {
    config = await prisma.budgetConfig.create({
      data: { monthlyBudget: 350, month, year },
    });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const entries = await prisma.budgetEntry.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { mealPlan: { select: { id: true, date: true, status: true } } },
    orderBy: { date: "desc" },
  });

  const totalSpent = entries.reduce((sum, e) => sum + e.amount, 0);
  const remaining = config.monthlyBudget - totalSpent;
  const percentUsed = config.monthlyBudget > 0 ? (totalSpent / config.monthlyBudget) * 100 : 0;

  return (
    <BudgetClient
      initialConfig={config}
      initialEntries={entries as any}
      initialTotalSpent={totalSpent}
      initialRemaining={remaining}
      initialPercentUsed={percentUsed}
      currentMonth={month}
      currentYear={year}
    />
  );
}
