"use client";

import Link from "next/link";
import { Home } from "lucide-react";

const apps = [
  { href: "http://localhost:8888", label: "Hub",         icon: "🏠", active: false, external: true },
  { href: "http://localhost:3000", label: "Foody",       icon: "🍽️", active: true,  external: false },
  { href: "http://localhost:3001", label: "Thoughts",    icon: "💭", active: false, external: true },
  { href: "http://localhost:8081", label: "FamilyVault", icon: "🔐", active: false, external: true },
];

export function AppBar() {
  return (
    <div className="h-8 bg-gray-950 border-b border-white/5 flex items-center px-4 gap-1 shrink-0">
      {apps.map((app) =>
        app.external ? (
          <a
            key={app.href}
            href={app.href}
            target={app.active ? undefined : "_blank"}
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
              app.active
                ? "bg-orange-500/15 text-orange-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <span>{app.icon}</span>
            {app.label}
          </a>
        ) : (
          <Link
            key={app.href}
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400"
          >
            <span>{app.icon}</span>
            {app.label}
          </Link>
        )
      )}
    </div>
  );
}
