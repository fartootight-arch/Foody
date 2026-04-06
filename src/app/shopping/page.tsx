import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatGBP, formatDateShort } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const rawLists = await (prisma as any).shoppingList.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: { select: { estimatedCost: true } },
    },
  });

  const lists = rawLists.map((list: any) => ({
    ...list,
    itemCount: list._count.items,
    estimatedTotal: list.items.reduce(
      (sum: number, item: any) => sum + (item.estimatedCost ?? 0),
      0
    ),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Lists</h1>
          <p className="mt-1 text-sm text-gray-500">
            {lists.length} list{lists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/shopping/generate">
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Auto-Generate
            </Button>
          </Link>
          <Link href="/shopping/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New List
            </Button>
          </Link>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No shopping lists yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Create a list manually or auto-generate one from your low-stock items.
          </p>
          <Link href="/shopping/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New List
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list: any) => (
            <Link key={list.id} href={`/shopping/${list.id}`}>
              <Card className="hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{list.name}</h3>
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

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{list.itemCount} item{list.itemCount !== 1 ? "s" : ""}</span>
                    <span className="font-medium text-gray-700">
                      {formatGBP(list.estimatedTotal)} est.
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">{formatDateShort(list.createdAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
