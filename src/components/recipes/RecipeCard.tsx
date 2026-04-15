import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, PoundSterling } from "lucide-react";
import { formatGBP } from "@/lib/utils";
import { RecipeLikeButton } from "./RecipeLikeButton";

interface RecipeIngredient {
  quantity: number;
  ingredient: {
    costPerUnit: number;
  };
}

interface Person {
  id: number;
  name: string;
  avatarColor: string;
}

interface Recipe {
  id: number;
  name: string;
  description?: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string;
  ingredients: RecipeIngredient[];
  likes: { personId: number }[];
}

interface RecipeCardProps {
  recipe: Recipe;
  people: Person[];
}

export function RecipeCard({ recipe, people }: RecipeCardProps) {
  const tags = recipe.dietaryTags ? recipe.dietaryTags.split(",").filter(Boolean) : [];
  const totalCost = recipe.ingredients.reduce(
    (sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
    0
  );
  const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : 0;
  const totalTime = recipe.prepTime + recipe.cookTime;
  const likedByIds = recipe.likes.map((l) => l.personId);

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{recipe.servings}</span>
            </div>
            {costPerServing > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <PoundSterling className="w-3.5 h-3.5" />
                <span>{formatGBP(costPerServing)}/serving</span>
              </div>
            )}
          </div>

          {/* Like buttons — one per person */}
          {people.length > 0 && (
            <RecipeLikeButton
              recipeId={recipe.id}
              people={people}
              initialLikedByIds={likedByIds}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
