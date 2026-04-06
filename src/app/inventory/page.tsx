import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { IngredientCard } from "@/components/inventory/IngredientCard";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShoppingBasket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const ingredients = await prisma.ingredient.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const lowStock = ingredients.filter((i) => i.currentQuantity <= i.minQuantity);
  const categories = [...new Set(ingredients.map((i) => i.category.name))].sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventory"
        subtitle={`${ingredients.length} ingredients tracked`}
        action={{ label: "Add Ingredient", href: "/inventory/new" }}
      />

      {lowStock.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} running low
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lowStock.map((i) => i.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {ingredients.length === 0 ? (
        <EmptyState
          title="No ingredients yet"
          description="Start adding ingredients to track your inventory and plan meals."
          actionLabel="Add First Ingredient"
          actionHref="/inventory/new"
          icon={<ShoppingBasket className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-8">
          {categories.map((categoryName) => {
            const items = ingredients.filter((i) => i.category.name === categoryName);
            const category = items[0].category;
            return (
              <div key={categoryName}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {categoryName}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {items.map((ingredient) => (
                    <IngredientCard key={ingredient.id} ingredient={ingredient} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
