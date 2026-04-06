"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBasket,
  BookOpen,
  Users,
  CalendarDays,
  PoundSterling,
  Settings,
  ChefHat,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: ShoppingBasket },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/people", label: "People", icon: Users },
  { href: "/planner", label: "Meal Planner", icon: CalendarDays },
  { href: "/shopping", label: "Shopping List", icon: ShoppingCart },
  { href: "/budget", label: "Budget", icon: PoundSterling },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Foody</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Smart meal planner</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-orange-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Foody v1.0</p>
      </div>
    </aside>
  );
}
