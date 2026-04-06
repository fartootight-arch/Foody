import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  formatDate,
  formatGBP,
  healthRatingEmoji,
  healthRatingLabel,
  statusColor,
  parseJsonArray,
} from "@/lib/utils";
import { ArrowLeft, Users, Clock, ChefHat } from "lucide-react";
import { PlannerActions } from "./PlannerActions";

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

  // Calculate total cost from accepted entries
  let totalCost = 0;
  for (const entry of mealPlan.entries) {
    if (entry.accepted && entry.recipe) {
      for (const ri of entry.recipe.ingredients) {
        totalCost += ri.quantity * ri.ingredient.costPerUnit;
      }
    }
  }

  // Parse AI suggestion notes if available
  let planningNotes: string | null = null;
  if (mealPlan.aiSuggestion) {
    try {
      const parsed = JSON.parse(mealPlan.aiSuggestion);
      planningNotes = parsed.planningNotes ?? null;
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
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {mealPlan.entries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No meal entries for this plan.</p>
              </CardContent>
            </Card>
          ) : (
            mealPlan.entries.map((entry) => {
              const mealName = entry.suggestedName ?? entry.recipe?.name ?? "Unknown meal";
              const instructions = entry.recipe ? parseJsonArray(entry.recipe.instructions) : [];
              const entryCost = entry.recipe
                ? entry.recipe.ingredients.reduce(
                    (sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
                    0
                  )
                : 0;

              return (
                <Card
                  key={entry.id}
                  className={`${!entry.accepted ? "opacity-50 border-dashed" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={
                              entry.role === "main"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {entry.role}
                          </Badge>
                          {!entry.accepted && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                              rejected
                            </Badge>
                          )}
                          {entry.recipe && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              <ChefHat className="w-3 h-3 mr-1" />
                              recipe
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{mealName}</CardTitle>
                        {entry.suggestedDescription && (
                          <p className="text-sm text-gray-500 mt-1">{entry.suggestedDescription}</p>
                        )}
                      </div>
                      {entryCost > 0 && (
                        <span className="text-orange-600 font-semibold">{formatGBP(entryCost)}</span>
                      )}
                    </div>
                  </CardHeader>

                  {entry.recipe && (
                    <CardContent className="space-y-3">
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Prep: {entry.recipe.prepTime}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Cook: {entry.recipe.cookTime}m
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Ingredients:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {entry.recipe.ingredients.map((ri) => (
                            <div key={ri.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"
                              />
                              <span>
                                {ri.quantity} {ri.unit} {ri.ingredient.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {instructions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Instructions:</p>
                          <ol className="space-y-1.5">
                            {instructions.map((step, idx) => (
                              <li key={idx} className="flex gap-2 text-xs text-gray-600">
                                <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {idx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
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

          {/* AI notes */}
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
