"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatGBP } from "@/lib/utils";
import { Clock, Users, AlertTriangle, Check, X, ChefHat } from "lucide-react";

interface MissingIngredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

interface MealSuggestion {
  name: string;
  description: string;
  isExistingRecipe: boolean;
  recipeId: number | null;
  estimatedCost: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  suitableFor: string[];
  missingIngredients: MissingIngredient[];
  dietaryTags: string[];
  ingredients: string[];
  instructions: string[];
}

interface MealSuggestionCardProps {
  meal: MealSuggestion;
  role: "main" | "alternative";
  accepted?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function MealSuggestionCard({
  meal,
  role,
  accepted,
  onAccept,
  onReject,
}: MealSuggestionCardProps) {
  const isForAll = meal.suitableFor?.includes("all") || meal.suitableFor?.length === 0;

  return (
    <Card
      className={`relative transition-all ${
        accepted === true
          ? "ring-2 ring-green-400 bg-green-50/30"
          : accepted === false
          ? "ring-2 ring-gray-200 opacity-60"
          : ""
      }`}
    >
      <div className="absolute top-3 right-3 flex gap-1.5">
        <Badge
          variant="secondary"
          className={
            role === "main"
              ? "bg-orange-100 text-orange-700"
              : "bg-blue-100 text-blue-700"
          }
        >
          {role === "main" ? "Main" : "Alternative"}
        </Badge>
        {meal.isExistingRecipe && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <ChefHat className="w-3 h-3 mr-1" />
            In recipes
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2 pr-32">
        <CardTitle className="text-lg">{meal.name}</CardTitle>
        <p className="text-sm text-gray-500">{meal.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Prep: {meal.prepTime}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Cook: {meal.cookTime}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{meal.servings} servings</span>
          </div>
          <div className="ml-auto font-semibold text-orange-600">
            {formatGBP(meal.estimatedCost)}
          </div>
        </div>

        {/* Suitable for */}
        {!isForAll && meal.suitableFor.length > 0 && (
          <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
            Suitable for: {meal.suitableFor.join(", ")}
          </p>
        )}

        {/* Dietary tags */}
        {meal.dietaryTags && meal.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meal.dietaryTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Missing ingredients */}
        {meal.missingIngredients && meal.missingIngredients.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Missing ingredients (need to buy):
            </div>
            {meal.missingIngredients.map((mi, idx) => (
              <div key={idx} className="flex justify-between text-xs text-amber-600 pl-5">
                <span>
                  {mi.quantity} {mi.unit} {mi.name}
                </span>
                {mi.estimatedCost > 0 && (
                  <span>~{formatGBP(mi.estimatedCost)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ingredients summary */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Ingredients:</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {meal.ingredients.slice(0, 6).join(", ")}
              {meal.ingredients.length > 6 && (
                <span className="text-gray-400"> +{meal.ingredients.length - 6} more</span>
              )}
            </p>
          </div>
        )}

        {/* Accept/Reject buttons */}
        {(onAccept || onReject) && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button
              variant={accepted === true ? "default" : "outline"}
              size="sm"
              className={`flex-1 gap-2 ${accepted === true ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-200 hover:bg-green-50"}`}
              onClick={onAccept}
            >
              <Check className="w-4 h-4" />
              {accepted === true ? "Accepted" : "Accept"}
            </Button>
            <Button
              variant={accepted === false ? "secondary" : "outline"}
              size="sm"
              className={`flex-1 gap-2 ${accepted === false ? "" : "text-red-500 border-red-200 hover:bg-red-50"}`}
              onClick={onReject}
            >
              <X className="w-4 h-4" />
              {accepted === false ? "Rejected" : "Reject"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
