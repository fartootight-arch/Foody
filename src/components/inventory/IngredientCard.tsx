"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockBar } from "./StockBar";
import { formatGBP } from "@/lib/utils";
import { AlertTriangle, Pencil, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
  category: {
    id: number;
    name: string;
    color: string;
  };
}

// How many units does 1 "item" represent?
// e.g. packageSize=4 and unit="pack" → 1 item = 0.25 packs
// e.g. packageSize=1 → 1 item = 1 unit (no difference)
function itemStep(packageSize: number): number {
  return packageSize > 1 ? 1 / packageSize : 1;
}

interface IngredientCardProps {
  ingredient: Ingredient;
  onUpdate?: () => void;
}

export function IngredientCard({ ingredient, onUpdate }: IngredientCardProps) {
  const [quantity, setQuantity] = useState(ingredient.currentQuantity);
  const [loading, setLoading] = useState(false);
  const isLowStock = quantity <= ingredient.minQuantity;
  const isOutOfStock = quantity <= 0;

  const adjust = async (amount: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${ingredient.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: "Manual adjustment" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setQuantity(data.ingredient.currentQuantity);
      onUpdate?.();
      toast.success(`${ingredient.name} updated`);
    } catch {
      toast.error("Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`relative ${isLowStock ? "border-amber-200" : ""} ${isOutOfStock ? "border-red-200" : ""}`}>
      {isLowStock && (
        <div className="absolute top-2 right-2">
          <AlertTriangle className={`w-4 h-4 ${isOutOfStock ? "text-red-500" : "text-amber-500"}`} />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2 pr-6">
          <div
            className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: ingredient.category.color }}
          />
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{ingredient.name}</h3>
            <Badge variant="secondary" className="text-xs mt-0.5" style={{ backgroundColor: ingredient.category.color + "20", color: ingredient.category.color }}>
              {ingredient.category.name}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {quantity.toFixed(quantity % 1 === 0 ? 0 : 1)} {ingredient.unit}
            </span>
            <span>min: {ingredient.minQuantity} {ingredient.unit}</span>
          </div>
          <StockBar current={quantity} min={ingredient.minQuantity} unit={ingredient.unit} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {ingredient.packageSize > 1
                ? `${formatGBP(ingredient.packageCost)} / ${ingredient.packageSize} ${ingredient.unit}`
                : `${formatGBP(ingredient.packageCost)} / ${ingredient.unit}`}
            </span>
            <Link href={`/inventory/${ingredient.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {/* Adjust buttons */}
          {ingredient.packageSize > 1 ? (
            <div className="grid grid-cols-2 gap-1">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 flex-1"
                  onClick={() => adjust(-itemStep(ingredient.packageSize))}
                  disabled={loading || quantity <= 0}
                  title="Remove 1 item"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-[10px] text-gray-400 self-center">item</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 flex-1"
                  onClick={() => adjust(itemStep(ingredient.packageSize))}
                  disabled={loading}
                  title="Add 1 item"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 flex-1"
                  onClick={() => adjust(-1)}
                  disabled={loading || quantity <= 0}
                  title="Remove 1 pack"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-[10px] text-gray-400 self-center">pack</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 flex-1"
                  onClick={() => adjust(1)}
                  disabled={loading}
                  title="Add 1 pack"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => adjust(-1)}
                disabled={loading || quantity <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => adjust(1)}
                disabled={loading}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
