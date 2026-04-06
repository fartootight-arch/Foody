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

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {ingredient.packageSize > 1
              ? `${formatGBP(ingredient.packageCost)} / ${ingredient.packageSize}${ingredient.unit}`
              : `${formatGBP(ingredient.packageCost)} / ${ingredient.unit}`}
          </span>
          <div className="flex items-center gap-1">
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
            <Link href={`/inventory/${ingredient.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
