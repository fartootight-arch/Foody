import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    const year = Number(searchParams.get("year") ?? now.getFullYear());

    let config = await prisma.budgetConfig.findFirst({ where: { month, year } });

    if (!config) {
      config = await prisma.budgetConfig.create({
        data: { monthlyBudget: 350, month, year },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/budget/config error:", error);
    return NextResponse.json({ error: "Failed to fetch budget config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyBudget, month, year } = body;

    if (monthlyBudget === undefined) {
      return NextResponse.json({ error: "monthlyBudget is required" }, { status: 400 });
    }

    const now = new Date();
    const m = Number(month ?? now.getMonth() + 1);
    const y = Number(year ?? now.getFullYear());

    const config = await prisma.budgetConfig.upsert({
      where: { month_year: { month: m, year: y } },
      update: { monthlyBudget: Number(monthlyBudget) },
      create: { monthlyBudget: Number(monthlyBudget), month: m, year: y },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("PUT /api/budget/config error:", error);
    return NextResponse.json({ error: "Failed to update budget config" }, { status: 500 });
  }
}
