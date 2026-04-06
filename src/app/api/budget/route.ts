import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    const year = Number(searchParams.get("year") ?? now.getFullYear());

    const config = await prisma.budgetConfig.findFirst({
      where: { month, year },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const entries = await prisma.budgetEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { mealPlan: { select: { date: true, status: true } } },
      orderBy: { date: "desc" },
    });

    const totalSpent = entries.reduce((sum, e) => sum + e.amount, 0);
    const monthlyBudget = config?.monthlyBudget ?? 350;
    const remaining = monthlyBudget - totalSpent;
    const percentUsed = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

    return NextResponse.json({
      config: config ?? { id: null, monthlyBudget: 350, month, year },
      entries,
      totalSpent,
      remaining,
      percentUsed,
    });
  } catch (error) {
    console.error("GET /api/budget error:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}
