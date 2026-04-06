"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatGBP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  category?: { name: string; color: string };
}

interface ShoppingItem {
  id: string;
  ingredientId?: number | null;
  ingredient?: Ingredient | null;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost?: number | null;
  checked: boolean;
  source: string;
  notes?: string | null;
}

interface ShoppingList {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  items: ShoppingItem[];
}

const SOURCE_LABELS: Record<string, string> = {
  meal_plan: "Meal Plan",
  low_stock: "Low Stock",
  manual: "Manual",
};

const SOURCE_ORDER = ["meal_plan", "low_stock", "manual"];

export default function ShoppingListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [addForm, setAddForm] = useState({ name: "", quantity: "", unit: "" });
  const [adding, setAdding] = useState(false);
  const [restocking, setRestocking] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch(`/api/shopping/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data: ShoppingList = await res.json();
      setList(data);
      setItems(data.items);
      setNameInput(data.name);
    } catch {
      toast.error("Failed to load shopping list");
      router.push("/shopping");
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveName = async () => {
    if (!list || nameInput === list.name) {
      setEditingName(false);
      return;
    }
    try {
      await fetch(`/api/shopping/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });
      setList((prev) => prev ? { ...prev, name: nameInput } : prev);
      setEditingName(false);
    } catch {
      toast.error("Failed to update name");
    }
  };

  const toggleItem = async (item: ShoppingItem) => {
    const newChecked = !item.checked;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: newChecked } : i))
    );
    try {
      await fetch(`/api/shopping/${id}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked: newChecked }),
      });
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i))
      );
      toast.error("Failed to update item");
    }
  };

  const deleteItem = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/shopping/${id}/items/${itemId}`, { method: "DELETE" });
    } catch {
      toast.error("Failed to delete item");
      fetchList();
    }
  };

  const clearChecked = async () => {
    const checkedItems = items.filter((i) => i.checked);
    if (checkedItems.length === 0) return;
    setItems((prev) => prev.filter((i) => !i.checked));
    try {
      await Promise.all(
        checkedItems.map((item) =>
          fetch(`/api/shopping/${id}/items/${item.id}`, { method: "DELETE" })
        )
      );
      toast.success(`Removed ${checkedItems.length} checked item${checkedItems.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to clear checked items");
      fetchList();
    }
  };

  const restockFromChecked = async () => {
    const checkedWithIngredient = items.filter((i) => i.checked && i.ingredientId);
    if (checkedWithIngredient.length === 0) {
      toast.error("No checked items with linked ingredients to restock");
      return;
    }
    setRestocking(true);
    try {
      await Promise.all(
        checkedWithIngredient.map((item) =>
          fetch(`/api/inventory/${item.ingredientId}/adjust`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: item.quantity,
              reason: "shopping_restock",
            }),
          })
        )
      );
      toast.success(`Restocked ${checkedWithIngredient.length} ingredient${checkedWithIngredient.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to restock some ingredients");
    } finally {
      setRestocking(false);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.unit || !addForm.quantity) {
      toast.error("Please fill in name, quantity and unit");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/shopping/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          quantity: Number(addForm.quantity),
          unit: addForm.unit,
          source: "manual",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      setAddForm({ name: "", quantity: "", unit: "" });
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  const markComplete = async () => {
    try {
      await fetch(`/api/shopping/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      setList((prev) => prev ? { ...prev, status: "completed" } : prev);
      toast.success("List marked as complete");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (!list) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const groupedItems = SOURCE_ORDER.reduce<Record<string, ShoppingItem[]>>((acc, source) => {
    const group = items.filter((i) => i.source === source);
    if (group.length > 0) acc[source] = group;
    return acc;
  }, {});
  // Also capture any items with unknown source
  const knownSources = new Set(SOURCE_ORDER);
  const otherItems = items.filter((i) => !knownSources.has(i.source));
  if (otherItems.length > 0) groupedItems["manual"] = [...(groupedItems["manual"] ?? []), ...otherItems];

  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const estimatedTotal = items.reduce((sum, i) => sum + (i.estimatedCost ?? 0), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/shopping">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                autoFocus
                className="text-xl font-bold"
              />
              <Button onClick={saveName} size="sm">Save</Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-2xl font-bold text-gray-900 hover:text-orange-600 transition-colors truncate block w-full text-left"
              title="Click to edit"
            >
              {list.name}
            </button>
          )}
        </div>
        <Badge
          variant="secondary"
          className={
            list.status === "completed"
              ? "bg-green-50 text-green-700 shrink-0"
              : "bg-blue-50 text-blue-700 shrink-0"
          }
        >
          {list.status}
        </Badge>
      </div>

      {/* Add Item */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addItem} className="flex gap-2 flex-wrap">
            <Input
              placeholder="Item name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="flex-1 min-w-32"
            />
            <Input
              type="number"
              placeholder="Qty"
              step="any"
              min="0"
              value={addForm.quantity}
              onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
              className="w-20"
            />
            <Input
              placeholder="Unit"
              value={addForm.unit}
              onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
              className="w-20"
            />
            <Button type="submit" disabled={adding} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Items by Group */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm">No items yet. Add some above.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {Object.entries(groupedItems).map(([source, groupItems], idx) => (
              <div key={source}>
                {idx > 0 && <Separator />}
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {SOURCE_LABELS[source] ?? source}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {groupItems.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        item.checked ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(item)}
                        className="shrink-0 text-gray-400 hover:text-orange-500 transition-colors"
                      >
                        {item.checked ? (
                          <CheckSquare className="w-5 h-5 text-orange-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm font-medium text-gray-900 ${
                            item.checked ? "line-through text-gray-400" : ""
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.estimatedCost != null && item.estimatedCost > 0 && (
                        <span className="text-xs text-gray-500 shrink-0">
                          {formatGBP(item.estimatedCost)}
                        </span>
                      )}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {checkedCount}/{totalItems} items checked
            </span>
            <span className="font-semibold text-gray-800">
              {formatGBP(estimatedTotal)} estimated
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {checkedCount > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChecked}
                  className="gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Checked
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restockFromChecked}
                  disabled={restocking}
                  className="gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${restocking ? "animate-spin" : ""}`} />
                  Restock from Checked
                </Button>
              </>
            )}
            {list.status !== "completed" && (
              <Button
                size="sm"
                onClick={markComplete}
                className="gap-1 ml-auto"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
