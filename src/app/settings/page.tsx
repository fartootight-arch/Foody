"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatGBP, getMonthName } from "@/lib/utils";
import { Check, X, Info, Key, ChefHat, PoundSterling } from "lucide-react";

export default function SettingsPage() {
  const [budgetAmount, setBudgetAmount] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{ monthlyBudget: number; month: number; year: number } | null>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    fetch(`/api/budget/config?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((config) => {
        setCurrentConfig(config);
        setBudgetAmount(String(config.monthlyBudget));
      })
      .catch(() => toast.error("Failed to load budget config"));
  }, [month, year]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      const res = await fetch("/api/budget/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBudget: Number(budgetAmount),
          month,
          year,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setCurrentConfig(updated);
      toast.success("Budget updated!");
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSavingBudget(false);
    }
  };

  const apiKeyConfigured = Boolean(
    typeof window !== "undefined" ? true : process.env.ANTHROPIC_API_KEY
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Configure your Foody app" />

      <div className="space-y-6">
        {/* Budget settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PoundSterling className="w-5 h-5 text-orange-500" />
              Budget Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentConfig && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-500">
                  Current budget for{" "}
                  <strong>
                    {getMonthName(currentConfig.month)} {currentConfig.year}
                  </strong>
                  : <strong className="text-orange-600">{formatGBP(currentConfig.monthlyBudget)}</strong>
                </p>
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="budgetAmount">
                  Monthly budget for {getMonthName(month)} {year}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                    <Input
                      id="budgetAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="pl-7"
                      placeholder="350.00"
                    />
                  </div>
                  <Button type="submit" disabled={savingBudget}>
                    {savingBudget ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* API Key section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex-1">
                <p className="text-sm font-medium">Anthropic API Key</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Required for AI meal suggestions
                </p>
              </div>
              <Badge
                variant="secondary"
                className={
                  apiKeyConfigured
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {apiKeyConfigured ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Configured
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Not configured
                  </>
                )}
              </Badge>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">How to configure</p>
              </div>
              <ol className="text-sm text-blue-600 space-y-1.5 ml-6 list-decimal">
                <li>
                  Get your API key from{" "}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-800"
                  >
                    console.anthropic.com
                  </a>
                </li>
                <li>
                  Create or open <code className="bg-blue-100 px-1 rounded">.env.local</code> in your project root
                </li>
                <li>
                  Add the line:{" "}
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    ANTHROPIC_API_KEY=sk-ant-...
                  </code>
                </li>
                <li>Restart the development server</li>
              </ol>
              <p className="text-xs text-blue-500 ml-6">
                Without an API key, Foody will use a demo mode with a mock meal suggestion.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              About Foody
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Foody</p>
                <p className="text-sm text-gray-500">Smart AI Meal Planner</p>
                <p className="text-xs text-gray-400">Version 1.0.0</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                Foody is a personal meal planning app that uses AI to suggest perfect evening
                meals based on your household preferences, inventory, and budget.
              </p>
              <p className="text-xs text-gray-400">
                Built with Next.js 14, Prisma, Tailwind CSS, and Claude AI.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">Framework</p>
                <p className="text-xs font-medium">Next.js 14</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">Database</p>
                <p className="text-xs font-medium">SQLite</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">AI Model</p>
                <p className="text-xs font-medium">Claude</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
