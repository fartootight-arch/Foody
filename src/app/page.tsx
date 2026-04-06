import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateShort, formatGBP, healthRatingEmoji, statusColor } from "@/lib/utils";
import {
  CalendarDays,
  AlertTriangle,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Budget data
  const budgetConfig = await prisma.budgetConfig.findFirst({ where: { month, year } });
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const budgetEntries = await prisma.budgetEntry.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
  });
  const totalSpent = budgetEntries.reduce((sum, e) => sum + e.amount, 0);
  const monthlyBudget = budgetConfig?.monthlyBudget ?? 350;
  const remaining = monthlyBudget - totalSpent;
  const percentUsed = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;

  // Low stock ingredients (top 5)
  const allIngredients = await prisma.ingredient.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  const lowStock = allIngredients
    .filter((i) => i.currentQuantity <= i.minQuantity)
    .slice(0, 5);

  // Upcoming meal plans (next 7 days)
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const upcomingPlans = await prisma.mealPlan.findMany({
    where: {
      date: { gte: now, lte: sevenDaysLater },
    },
    include: {
      people: { include: { person: true } },
      entries: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { date: "asc" },
    take: 5,
  });

  // Stats
  const recipeCount = await prisma.recipe.count();
  const peopleCount = await prisma.person.count();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome banner */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Good evening</h1>
            <p className="text-gray-500 mt-1">{formatDate(now)}</p>
          </div>
          <Link href="/planner/new">
            <Button className="gap-2 shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
              Plan Tonight&apos;s Meal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4">
            <p className="text-xs text-orange-600 font-medium">Budget Remaining</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{formatGBP(remaining)}</p>
            <p className="text-xs text-orange-500 mt-0.5">{Math.round(percentUsed)}% used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Ingredients</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{allIngredients.length}</p>
            {lowStock.length > 0 && (
              <p className="text-xs text-amber-500 mt-0.5">{lowStock.length} low stock</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Recipes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{recipeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">People</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{peopleCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Budget This Month
              <Link href="/budget" className="text-xs text-orange-500 hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Spent</span>
              <span className="font-medium">{formatGBP(totalSpent)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentUsed > 90 ? "bg-red-500" : percentUsed > 70 ? "bg-amber-500" : "bg-orange-500"
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{formatGBP(remaining)} remaining</span>
              <span className="text-gray-400">{formatGBP(monthlyBudget)} budget</span>
            </div>
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock
              </span>
              <Link href="/inventory" className="text-xs text-orange-500 hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">All stocked up!</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((ing) => (
                  <div key={ing.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ing.category.color }}
                      />
                      <span className="text-sm text-gray-700">{ing.name}</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        ing.currentQuantity <= 0 ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {ing.currentQuantity} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/inventory/new">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Add to Inventory
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming meals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-500" />
                Upcoming Meals
              </span>
              <Link href="/planner" className="text-xs text-orange-500 hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPlans.length === 0 ? (
              <div className="py-2">
                <p className="text-sm text-gray-400">No meals planned for this week.</p>
                <Link href="/planner/new" className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Plan a meal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPlans.map((plan) => {
                  const mainEntry = plan.entries[0];
                  return (
                    <Link key={plan.id} href={`/planner/${plan.id}`}>
                      <div className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded-lg px-1 transition-colors">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">
                              {formatDateShort(plan.date)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${statusColor(plan.status)}`}
                            >
                              {plan.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {mainEntry?.suggestedName ?? "Planned meal"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{healthRatingEmoji(plan.healthRating)}</span>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/planner/new">
          <Button variant="outline" className="w-full gap-2 h-12">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Plan Meal
          </Button>
        </Link>
        <Link href="/inventory/new">
          <Button variant="outline" className="w-full gap-2 h-12">
            <Plus className="w-4 h-4 text-green-500" />
            Add Ingredient
          </Button>
        </Link>
        <Link href="/recipes/new">
          <Button variant="outline" className="w-full gap-2 h-12">
            <Plus className="w-4 h-4 text-blue-500" />
            Add Recipe
          </Button>
        </Link>
        <Link href="/people/new">
          <Button variant="outline" className="w-full gap-2 h-12">
            <Plus className="w-4 h-4 text-purple-500" />
            Add Person
          </Button>
        </Link>
      </div>
    </div>
  );
}
