"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/utils";
import { Clock, ChefHat } from "lucide-react";
import { MealRefinementChat } from "./MealRefinementChat";
import { SaveAsRecipeButton } from "./SaveAsRecipeButton";

interface AISuggestion {
  primaryMeal: MealData;
  alternativeMeal: MealData | null;
  planningNotes?: string;
  totalEstimatedCost?: number;
}

interface MealData {
  name?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  missingIngredients?: any[];
}

interface Entry {
  id: number;
  role: string;
  accepted: boolean;
  suggestedName?: string | null;
  suggestedDescription?: string | null;
  recipe?: {
    prepTime: number;
    cookTime: number;
    servings: number;
    instructions: string;
    ingredients: { id: number; quantity: number; unit: string; ingredient: { name: string } }[];
  } | null;
}

interface Props {
  mealPlanId: number;
  entries: Entry[];
  initialSuggestion: AISuggestion | null;
}

function parseInstructions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw
      .split(/\n+/)
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  }
}

export function PlannerDetailClient({ mealPlanId, entries, initialSuggestion }: Props) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(initialSuggestion);
  const router = useRouter();

  const handleUpdated = (newSuggestion: AISuggestion) => {
    setSuggestion(newSuggestion);
    // Refresh server component data (e.g. entry names updated in DB)
    router.refresh();
  };

  const aiPrimary = suggestion?.primaryMeal ?? null;
  const aiAlternative = suggestion?.alternativeMeal ?? null;

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const aiData = entry.role === "main" ? aiPrimary : aiAlternative;

        const mealName = aiData?.name ?? entry.suggestedName ?? "Unknown meal";
        const mealDesc = aiData?.description ?? entry.suggestedDescription;

        const instructions = entry.recipe
          ? parseInstructions(entry.recipe.instructions)
          : (aiData?.instructions ?? []);

        const ingredientLines: string[] = entry.recipe
          ? entry.recipe.ingredients.map((ri) => `${ri.quantity} ${ri.unit} ${ri.ingredient.name}`)
          : (aiData?.ingredients ?? []);

        const prepTime = entry.recipe?.prepTime ?? aiData?.prepTime;
        const cookTime = entry.recipe?.cookTime ?? aiData?.cookTime;
        const missingIngredients: any[] = entry.recipe ? [] : (aiData?.missingIngredients ?? []);
        const hasContent = ingredientLines.length > 0 || instructions.length > 0;

        return (
          <Card key={entry.id} className={!entry.accepted ? "opacity-50 border-dashed" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={entry.role === "main" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}
                    >
                      {entry.role}
                    </Badge>
                    {!entry.accepted && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-500">rejected</Badge>
                    )}
                    {entry.recipe ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        <ChefHat className="w-3 h-3 mr-1" />saved recipe
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-600">✨ AI created</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{mealName}</CardTitle>
                  {mealDesc && <p className="text-sm text-gray-500 mt-1">{mealDesc}</p>}
                </div>
              </div>
            </CardHeader>

            {/* Save as recipe button */}
            {entry.accepted && (
              <div className="px-6 pb-2 flex justify-end">
                <SaveAsRecipeButton
                  mealName={mealName}
                  description={mealDesc}
                  instructions={instructions}
                  ingredients={ingredientLines}
                  prepTime={prepTime}
                  cookTime={cookTime}
                  servings={entry.recipe?.servings ?? aiData?.servings ?? 2}
                  dietaryTags={[]}
                />
              </div>
            )}

            {hasContent && (
              <CardContent className="space-y-4">
                {(prepTime || cookTime) && (
                  <div className="flex gap-4 text-sm text-gray-500">
                    {prepTime != null && (
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Prep: {prepTime}m</span>
                    )}
                    {cookTime != null && (
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Cook: {cookTime}m</span>
                    )}
                  </div>
                )}

                {ingredientLines.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ingredients</p>
                    <div className="grid grid-cols-2 gap-1">
                      {ingredientLines.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1" />
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {missingIngredients.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1.5">🛒 You'll need to buy:</p>
                    <div className="space-y-0.5">
                      {missingIngredients.map((m: any, idx: number) => (
                        <p key={idx} className="text-xs text-amber-700">
                          • {m.quantity} {m.unit} {m.name}
                          {m.estimatedCost > 0 && (
                            <span className="text-amber-500 ml-1">(~{formatGBP(m.estimatedCost)})</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {instructions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Instructions</p>
                    <ol className="space-y-2">
                      {instructions.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Refinement chat — only show if there's an AI suggestion to work with */}
      {suggestion && (
        <MealRefinementChat mealPlanId={mealPlanId} onUpdated={handleUpdated} />
      )}
    </div>
  );
}
