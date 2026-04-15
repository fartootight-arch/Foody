"use client";

import { useState, useMemo } from "react";
import { IngredientCard } from "./IngredientCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  packageCost: number;
  packageSize: number;
  costPerUnit: number;
  currentQuantity: number;
  minQuantity: number;
  notes?: string | null;
  category: { id: number; name: string; color: string };
}

interface Props {
  ingredients: Ingredient[];
}

export function InventoryClient({ ingredients }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.name.toLowerCase().includes(q)
    );
  }, [ingredients, query]);

  const categories = useMemo(
    () => [...new Set(filtered.map((i) => i.category.name))].sort(),
    [filtered]
  );

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search ingredients or categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results summary when searching */}
      {query && (
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? "No ingredients match your search."
            : `${filtered.length} ingredient${filtered.length !== 1 ? "s" : ""} found`}
        </p>
      )}

      {/* Grouped grid */}
      <div className="space-y-8">
        {categories.map((categoryName) => {
          const items = filtered.filter((i) => i.category.name === categoryName);
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
    </div>
  );
}
