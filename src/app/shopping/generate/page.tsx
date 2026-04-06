"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function GenerateShoppingListPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/shopping/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((list) => {
        toast.success("Shopping list generated");
        router.replace(`/shopping/${list.id}`);
      })
      .catch(() => {
        toast.error("Failed to generate shopping list");
        router.replace("/shopping");
      });
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Generating shopping list...</p>
      </div>
    </div>
  );
}
