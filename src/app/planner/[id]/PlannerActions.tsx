"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatGBP } from "@/lib/utils";
import { CheckCircle, ChefHat, Trash2 } from "lucide-react";

interface PlannerActionsProps {
  mealPlanId: number;
  status: string;
  totalCost: number;
}

export function PlannerActions({ mealPlanId, status, totalCost }: PlannerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Meal plan confirmed! Ingredients deducted.");
      router.refresh();
    } catch {
      toast.error("Failed to confirm meal plan");
    } finally {
      setLoading(false);
    }
  };

  const handleCooked = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}/cooked`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalCost }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Marked as cooked! Budget updated.");
      router.refresh();
    } catch {
      toast.error("Failed to mark as cooked");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Meal plan deleted");
      router.push("/planner");
    } catch {
      toast.error("Failed to delete meal plan");
    }
  };

  return (
    <div className="space-y-2">
      {status === "draft" && (
        <ConfirmDialog
          trigger={
            <Button className="w-full gap-2" disabled={loading}>
              <CheckCircle className="w-4 h-4" />
              Confirm Plan
            </Button>
          }
          title="Confirm Meal Plan"
          description="This will deduct ingredients from your inventory. Are you sure?"
          onConfirm={handleConfirm}
          confirmLabel="Confirm & Deduct"
        />
      )}

      {status === "confirmed" && (
        <ConfirmDialog
          trigger={
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled={loading}>
              <ChefHat className="w-4 h-4" />
              Mark as Cooked
            </Button>
          }
          title="Mark as Cooked"
          description={`This will record a budget entry of ${formatGBP(totalCost)}. Continue?`}
          onConfirm={handleCooked}
          confirmLabel="Mark Cooked"
        />
      )}

      {status === "cooked" && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
          <p className="text-sm text-green-700 font-medium">Meal cooked!</p>
          <p className="text-xs text-green-600 mt-0.5">Budget entry recorded.</p>
        </div>
      )}

      <ConfirmDialog
        trigger={
          <Button variant="outline" className="w-full gap-2 text-red-500 hover:text-red-600 border-red-200">
            <Trash2 className="w-4 h-4" />
            Delete Plan
          </Button>
        }
        title="Delete Meal Plan"
        description="This will permanently delete this meal plan. This cannot be undone."
        onConfirm={handleDelete}
        destructive
        confirmLabel="Delete"
      />
    </div>
  );
}
