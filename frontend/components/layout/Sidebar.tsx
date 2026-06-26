"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Home,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/dashboard/questions", label: "Question Bank", icon: BookOpen },
  { href: "/dashboard/users", label: "Users", icon: Users, disabled: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, disabled: true },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="text-white font-semibold text-lg tracking-tight">
          Xebia
        </span>
        <p className="text-white/50 text-xs mt-0.5">AI Maturity Platform</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, disabled }) => {
          const active = path === href || path.startsWith(href + "/");
          if (disabled) {
            return (
              <span
                key={href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/30 cursor-not-allowed"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-velvet text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
