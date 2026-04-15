"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StockBar } from "@/components/inventory/StockBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatGBP } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface InventoryLog {
  id: number;
  changeAmount: number;
  reason: string;
  createdAt: string;
}

interface Ingredient {
  id: number;
  name: string;
  categoryId: number;
  unit: string;
  packageCost: number;
  packageSize: number;
  costPerUnit: number;
  currentQuantity: number;
  minQuantity: number;
  notes?: string | null;
  category: Category;
  inventoryLogs: InventoryLog[];
}

export default function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    unit: "",
    packageCost: "",
    packageSize: "",
    currentQuantity: "",
    minQuantity: "",
    notes: "",
  });
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/inventory/${id}`).then((r) => r.json()),
    ])
      .then(([cats, ing]) => {
        setCategories(cats);
        setIngredient(ing);
        setForm({
          name: ing.name,
          categoryId: String(ing.categoryId),
          unit: ing.unit,
          packageCost: String(ing.packageCost ?? 0),
          packageSize: String(ing.packageSize ?? 1),
          currentQuantity: String(ing.currentQuantity),
          minQuantity: String(ing.minQuantity),
          notes: ing.notes ?? "",
        });
      })
      .catch(() => toast.error("Failed to load ingredient"));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          categoryId: Number(form.categoryId),
          unit: form.unit,
          packageCost: Number(form.packageCost),
          packageSize: Number(form.packageSize),
          currentQuantity: Number(form.currentQuantity),
          minQuantity: Number(form.minQuantity),
          notes: form.notes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success("Ingredient updated");
      router.push("/inventory");
    } catch {
      toast.error("Failed to update ingredient");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || !adjustReason) {
      toast.error("Please enter amount and reason");
      return;
    }
    setAdjusting(true);
    try {
      const res = await fetch(`/api/inventory/${id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(adjustAmount), reason: adjustReason }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIngredient((prev) =>
        prev
          ? {
              ...prev,
              currentQuantity: data.ingredient.currentQuantity,
              inventoryLogs: [data.log, ...prev.inventoryLogs].slice(0, 10),
            }
          : prev
      );
      setForm((f) => ({ ...f, currentQuantity: String(data.ingredient.currentQuantity) }));
      setAdjustAmount("");
      setAdjustReason("");
      toast.success("Stock adjusted");
    } catch {
      toast.error("Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Ingredient deleted");
      router.push("/inventory");
    } catch {
      toast.error("Failed to delete ingredient");
      setDeleting(false);
    }
  };

  if (!ingredient) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title={`Edit: ${ingredient.name}`} subtitle="Update ingredient details" />
        <ConfirmDialog
          trigger={
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          }
          title="Delete Ingredient"
          description={`Are you sure you want to delete ${ingredient.name}? This cannot be undone.`}
          onConfirm={handleDelete}
          destructive
          confirmLabel="Delete"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageCost">Package price (£)</Label>
                  <Input
                    id="packageCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.packageCost}
                    onChange={(e) => setForm({ ...form, packageCost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageSize">Package size</Label>
                  <Input
                    id="packageSize"
                    type="number"
                    step="any"
                    min="1"
                    value={form.packageSize}
                    onChange={(e) => setForm({ ...form, packageSize: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">e.g. for a 500g bag costing £1.50 — enter 1.50 and 500</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentQuantity">Current stock</Label>
                <Input
                  id="currentQuantity"
                  type="number"
                  step="any"
                  value={form.currentQuantity}
                  onChange={(e) => setForm({ ...form, currentQuantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minQuantity">Minimum stock</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  step="any"
                  min="0"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" type="button" onClick={() => router.push("/inventory")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stock Adjust</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Current: <strong>{ingredient.currentQuantity} {ingredient.unit}</strong>
            </p>
            <StockBar
              current={ingredient.currentQuantity}
              min={ingredient.minQuantity}
              unit={ingredient.unit}
              showLabel
            />
          </div>
          {/* Quick-tap buttons when package has multiple items */}
          {ingredient.packageSize > 1 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">
                Quick adjust — 1 item = {(1 / ingredient.packageSize).toFixed(4).replace(/\.?0+$/, "")} {ingredient.unit} ({ingredient.packageSize} per pack)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: `− 1 item`, amount: -(1 / ingredient.packageSize), reason: "Used 1 item" },
                  { label: `+ 1 item`, amount:  (1 / ingredient.packageSize), reason: "Added 1 item" },
                  { label: `− 1 pack`, amount: -1,                             reason: "Used 1 pack" },
                  { label: `+ 1 pack`, amount:  1,                             reason: "Restocked 1 pack" },
                ].map(({ label, amount, reason }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={adjusting}
                    className={amount < 0 ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}
                    onClick={async () => {
                      setAdjusting(true);
                      try {
                        const res = await fetch(`/api/inventory/${id}/adjust`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, reason }),
                        });
                        if (!res.ok) throw new Error("Failed");
                        const data = await res.json();
                        setIngredient((prev) =>
                          prev ? { ...prev, currentQuantity: data.ingredient.currentQuantity, inventoryLogs: [data.log, ...prev.inventoryLogs].slice(0, 10) } : prev
                        );
                        setForm((f) => ({ ...f, currentQuantity: String(data.ingredient.currentQuantity) }));
                        toast.success(`${label} applied`);
                      } catch {
                        toast.error("Failed to adjust stock");
                      } finally {
                        setAdjusting(false);
                      }
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Separator />
            </div>
          )}

          <form onSubmit={handleAdjust} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="adjustAmount">Custom amount</Label>
                <Input
                  id="adjustAmount"
                  type="number"
                  step="any"
                  placeholder="e.g. +5 or -2"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustReason">Reason</Label>
                <Input
                  id="adjustReason"
                  placeholder="e.g. Restocked, Used in cooking"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={adjusting}>
              {adjusting ? "Adjusting..." : "Apply Adjustment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {ingredient.inventoryLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ingredient.inventoryLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm text-gray-700">{log.reason}</p>
                    <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      log.changeAmount > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }
                  >
                    {log.changeAmount > 0 ? "+" : ""}
                    {log.changeAmount} {ingredient.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
