import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatGBP, healthRatingEmoji, healthRatingLabel, statusColor } from "@/lib/utils";
import { ArrowLeft, Users } from "lucide-react";
import { PlannerActions } from "./PlannerActions";
import { PlannerDetailClient } from "@/components/planner/PlannerDetailClient";

export const dynamic = "force-dynamic";

export default async function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id: Number(idStr) },
    include: {
      people: { include: { person: true } },
      entries: {
        include: {
          recipe: {
            include: {
              ingredients: { include: { ingredient: true } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      budgetEntry: true,
    },
  });

  if (!mealPlan) notFound();

  // Total cost from recipe-linked entries
  let totalCost = 0;
  for (const entry of mealPlan.entries) {
    if (entry.accepted && entry.recipe) {
      for (const ri of entry.recipe.ingredients) {
        totalCost += ri.quantity * ri.ingredient.costPerUnit;
      }
    }
  }

  // Parse planning notes from AI suggestion for the sidebar
  let planningNotes: string | null = null;
  let initialSuggestion: any = null;
  if (mealPlan.aiSuggestion) {
    try {
      initialSuggestion = JSON.parse(mealPlan.aiSuggestion);
      planningNotes = initialSuggestion?.planningNotes ?? null;
    } catch {}
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/planner">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            Planner
          </Button>
        </Link>
        <div className="flex-1" />
        <Badge className={`text-sm ${statusColor(mealPlan.status)}`} variant="secondary">
          {mealPlan.status}
        </Badge>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{formatDate(mealPlan.date)}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl">{healthRatingEmoji(mealPlan.healthRating)}</span>
          <span className="text-gray-600">{healthRatingLabel(mealPlan.healthRating)}</span>
          {mealPlan.moodText && (
            <span className="text-gray-400 italic text-sm">"{mealPlan.moodText}"</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — client component handles entries + refinement chat */}
        <div className="lg:col-span-2">
          {mealPlan.entries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No meal entries for this plan.</p>
              </CardContent>
            </Card>
          ) : (
            <PlannerDetailClient
              mealPlanId={mealPlan.id}
              entries={mealPlan.entries as any}
              initialSuggestion={initialSuggestion}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* People */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Eating
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mealPlan.people.length === 0 ? (
                <p className="text-sm text-gray-400">No people assigned</p>
              ) : (
                <div className="space-y-2">
                  {mealPlan.people.map((pp) => (
                    <div key={pp.id} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: pp.person.avatarColor }}
                      >
                        {pp.person.name.charAt(0)}
                      </div>
                      <span className="text-sm">{pp.person.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mealPlan.budgetEntry ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recorded cost</span>
                  <span className="font-semibold text-orange-600">
                    {formatGBP(mealPlan.budgetEntry.amount)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estimated cost</span>
                  <span className="font-semibold text-orange-600">{formatGBP(totalCost)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI planning notes */}
          {planningNotes && (
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-700">Foody's Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600">{planningNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <PlannerActions
            mealPlanId={mealPlan.id}
            status={mealPlan.status}
            totalCost={totalCost}
          />
        </div>
      </div>
    </div>
  );
}
