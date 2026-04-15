"use client";

import Link from "next/link";

// Use the browser's actual hostname so links work on any device, not just localhost
const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

const apps = [
  { href: `http://${host}:8888`,                label: "Hub",         icon: "🏠", active: false, external: true },
  { href: `http://${host}:3000`,                label: "Foody",       icon: "🍽️", active: true,  external: false },
  { href: `http://${host}:3001`,                label: "Thoughts",    icon: "💭", active: false, external: true },
  { href: "https://familyvault-ffea8.web.app/", label: "FamilyVault", icon: "🔐", active: false, external: true },
  { href: `http://${host}:3002`,                label: "AI Power",    icon: "🤖", active: false, external: true },
  { href: `http://${host}:8001`,                label: "Job Tracker", icon: "💼", active: false, external: true },
  { href: `http://${host}:8501`,                label: "GCSE",        icon: "🎓", active: false, external: true },
];

export function AppBar() {
  return (
    <div className="h-8 bg-gray-950 border-b border-white/5 flex items-center px-2 gap-0.5 shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {apps.map((app) =>
        app.external ? (
          <a
            key={app.label}
            href={app.href}
            target={app.active ? undefined : "_blank"}
            rel="noopener noreferrer"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors shrink-0 ${
              app.active
                ? "bg-orange-500/15 text-orange-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <span>{app.icon}</span>
            <span className="hidden sm:inline">{app.label}</span>
          </a>
        ) : (
          <Link
            key={app.label}
            href="/"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400 shrink-0"
          >
            <span>{app.icon}</span>
            <span className="hidden sm:inline">{app.label}</span>
          </Link>
        )
      )}
    </div>
  );
}
