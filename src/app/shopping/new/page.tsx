"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewShoppingListPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      const list = await res.json();
      toast.success("Shopping list created");
      router.push(`/shopping/${list.id}`);
    } catch {
      toast.error("Failed to create shopping list");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <PageHeader title="New Shopping List" subtitle="Create a new shopping list" />
      <Card>
        <CardHeader>
          <CardTitle>List Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">List name (optional)</Label>
              <Input
                id="name"
                placeholder={`Shopping List ${new Date().toLocaleDateString("en-GB")}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create List"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/shopping")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
