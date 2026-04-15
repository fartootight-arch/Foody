import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatGBP, parseJsonArray } from "@/lib/utils";
import { Clock, Users, ChefHat, Pencil, ArrowLeft, Check } from "lucide-react";
import { RecipeLikeButton } from "@/components/recipes/RecipeLikeButton";

export const dynamic = "force-dynamic";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const [recipe, people] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: Number(idStr) },
      include: {
        ingredients: {
          include: { ingredient: { include: { category: true } } },
          orderBy: { id: "asc" },
        },
        likes: { select: { personId: true } },
      },
    }),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!recipe) notFound();

  const tags = recipe.dietaryTags ? recipe.dietaryTags.split(",").filter(Boolean) : [];
  const instructions = parseJsonArray(recipe.instructions);
  const totalCost = recipe.ingredients.reduce(
    (sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
    0
  );
  const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : 0;
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/recipes">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            Recipes
          </Button>
        </Link>
        <div className="flex-1" />
        <Link href={`/recipes/${recipe.id}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{recipe.name}</h1>
          {recipe.description && (
            <p className="mt-2 text-gray-600">{recipe.description}</p>
          )}
          {recipe.source && (
            <p className="text-xs text-gray-400 mt-1">Source: {recipe.source}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {people.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Who likes this?</span>
              <RecipeLikeButton
                recipeId={recipe.id}
                people={people}
                initialLikedByIds={recipe.likes.map((l) => l.personId)}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">Prep Time</p>
            <p className="text-xl font-bold text-orange-600">{recipe.prepTime}m</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">Cook Time</p>
            <p className="text-xl font-bold text-orange-600">{recipe.cookTime}m</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">Servings</p>
            <p className="text-xl font-bold text-orange-600">{recipe.servings}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">Cost/Serving</p>
            <p className="text-xl font-bold text-orange-600">{formatGBP(costPerServing)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ingredients</span>
                <span className="text-sm font-normal text-gray-500">
                  Total: {formatGBP(totalCost)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.ingredients.length === 0 ? (
                <p className="text-sm text-gray-500">No ingredients listed.</p>
              ) : (
                <ul className="space-y-2">
                  {recipe.ingredients.map((ri) => {
                    const itemCost = ri.quantity * ri.ingredient.costPerUnit;
                    return (
                      <li
                        key={ri.id}
                        className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: ri.ingredient.category.color }}
                          />
                          <span className="text-sm text-gray-800">
                            <strong>
                              {ri.quantity} {ri.unit}
                            </strong>{" "}
                            {ri.ingredient.name}
                            {ri.optional && (
                              <span className="text-xs text-gray-400 ml-1">(optional)</span>
                            )}
                          </span>
                        </div>
                        {itemCost > 0 && (
                          <span className="text-xs text-gray-400">{formatGBP(itemCost)}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              {instructions.length === 0 ? (
                <p className="text-sm text-gray-500">No instructions added.</p>
              ) : (
                <ol className="space-y-4">
                  {instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
