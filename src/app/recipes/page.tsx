import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: selectedTag } = await searchParams;

  const [recipes, people] = await Promise.all([
    prisma.recipe.findMany({
      include: {
        ingredients: { include: { ingredient: true } },
        likes: { select: { personId: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Collect all unique tags
  const allTags = [
    ...new Set(
      recipes.flatMap((r) => (r.dietaryTags ? r.dietaryTags.split(",").filter(Boolean) : []))
    ),
  ].sort();

  const filtered = selectedTag
    ? recipes.filter((r) =>
        r.dietaryTags ? r.dietaryTags.split(",").includes(selectedTag) : false
      )
    : recipes;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Recipes"
        subtitle={`${recipes.length} recipes in your collection`}
        action={{ label: "Add Recipe", href: "/recipes/new" }}
      />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/recipes">
            <Badge
              variant={!selectedTag ? "default" : "secondary"}
              className="cursor-pointer capitalize"
            >
              All
            </Badge>
          </Link>
          {allTags.map((tag) => (
            <Link key={tag} href={`/recipes?tag=${encodeURIComponent(tag)}`}>
              <Badge
                variant={selectedTag === tag ? "default" : "secondary"}
                className="cursor-pointer capitalize"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={selectedTag ? `No ${selectedTag} recipes` : "No recipes yet"}
          description={
            selectedTag
              ? `No recipes tagged with "${selectedTag}" found.`
              : "Start building your recipe collection to plan great meals."
          }
          actionLabel={!selectedTag ? "Add First Recipe" : undefined}
          actionHref="/recipes/new"
          icon={<BookOpen className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} people={people} />
          ))}
        </div>
      )}
    </div>
  );
}
