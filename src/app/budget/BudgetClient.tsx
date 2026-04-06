"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { BudgetRing } from "@/components/budget/BudgetRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatGBP, formatDateShort, getMonthName } from "@/lib/utils";
import { Pencil, Check, X, ChevronLeft, ChevronRight, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

interface BudgetConfig {
  id: number;
  monthlyBudget: number;
  month: number;
  year: number;
}

interface BudgetEntry {
  id: number;
  mealPlanId: number | null;
  description: string | null;
  amount: number;
  date: string;
  category: string;
  mealPlan?: { id: number; date: string; status: string } | null;
}

interface BudgetClientProps {
  initialConfig: BudgetConfig;
  initialEntries: BudgetEntry[];
  initialTotalSpent: number;
  initialRemaining: number;
  initialPercentUsed: number;
  currentMonth: number;
  currentYear: number;
}

export function BudgetClient({
  initialConfig,
  initialEntries,
  initialTotalSpent,
  initialRemaining,
  initialPercentUsed,
  currentMonth,
  currentYear,
}: BudgetClientProps) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(initialConfig.monthlyBudget));
  const [savingBudget, setSavingBudget] = useState(false);

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  const handleSaveBudget = async () => {
    setSavingBudget(true);
    try {
      const res = await fetch("/api/budget/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBudget: Number(budgetInput),
          month: currentMonth,
          year: currentYear,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setConfig(updated);
      setEditingBudget(false);
      toast.success("Budget updated");
      router.refresh();
    } catch {
      toast.error("Failed to update budget");
    } finally {
      setSavingBudget(false);
    }
  };

  const percentUsed = config.monthlyBudget > 0
    ? Math.min((initialTotalSpent / config.monthlyBudget) * 100, 100)
    : 0;

  const CATEGORY_COLORS: Record<string, string> = {
    meal: "bg-orange-100 text-orange-700",
    ingredient_restock: "bg-blue-100 text-blue-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Budget"
        subtitle="Track your monthly food spending"
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/budget?month=${prevMonth}&year=${prevYear}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          {getMonthName(prevMonth)} {prevYear}
        </Link>
        <h2 className="text-lg font-semibold text-gray-900">
          {getMonthName(currentMonth)} {currentYear}
        </h2>
        <Link
          href={`/budget?month=${nextMonth}&year=${nextYear}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {getMonthName(nextMonth)} {nextYear}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Budget ring */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetRing spent={initialTotalSpent} total={config.monthlyBudget} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">Spent</p>
                <p className="font-bold text-gray-900">{formatGBP(initialTotalSpent)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-bold text-gray-900">{formatGBP(config.monthlyBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Monthly Budget
              {!editingBudget && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setBudgetInput(String(config.monthlyBudget));
                    setEditingBudget(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingBudget ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Monthly budget (£)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveBudget} disabled={savingBudget} className="flex-1">
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingBudget(false)}
                    className="flex-1"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatGBP(config.monthlyBudget)}</p>
                <p className="text-xs text-gray-400 mt-1">per month</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Used</span>
                <span className={percentUsed > 90 ? "text-red-600 font-medium" : "text-gray-700"}>
                  {Math.round(percentUsed)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentUsed > 90 ? "bg-red-500" : percentUsed > 70 ? "bg-amber-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["meal", "ingredient_restock", "other"].map((cat) => {
              const catTotal = initialEntries
                .filter((e) => e.category === cat)
                .reduce((sum, e) => sum + e.amount, 0);
              const catCount = initialEntries.filter((e) => e.category === cat).length;
              if (catCount === 0) return null;
              return (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[cat]}`}>
                      {cat.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-gray-400">{catCount}x</span>
                  </div>
                  <span className="text-sm font-medium">{formatGBP(catTotal)}</span>
                </div>
              );
            })}
            {initialEntries.length === 0 && (
              <p className="text-sm text-gray-400">No entries this month</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entries table */}
      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {initialEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No budget entries this month</p>
              <p className="text-xs text-gray-400 mt-1">
                Budget entries are created when you mark meals as cooked
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {initialEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="secondary"
                      className={`text-xs mt-0.5 ${CATEGORY_COLORS[entry.category] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {entry.category.replace("_", " ")}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {entry.description ?? "Budget entry"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateShort(entry.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatGBP(entry.amount)}</span>
                    {entry.mealPlanId && (
                      <Link href={`/planner/${entry.mealPlanId}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
