import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { AlertTriangle, ShoppingBasket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const ingredients = await prisma.ingredient.findMany({
    where: { category: { name: { not: "Hello Fresh" } } },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const lowStock = ingredients.filter((i) => i.currentQuantity <= i.minQuantity);

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
        <InventoryClient ingredients={ingredients} />
      )}
    </div>
  );
}
