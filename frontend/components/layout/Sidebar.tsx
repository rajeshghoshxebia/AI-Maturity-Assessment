"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, clearAppToken } from "@/lib/auth";
import { useMe } from "@/lib/use-me";
import { useState, useEffect } from "react";
import { useSidebar } from "./sidebar-context";

// Nav visible per role (Administrators see everything).
const CONSULTANT_HREFS = new Set([
  "/dashboard/organizations",
  "/dashboard/assessments",
]);
// All other non-admin roles: assessments (and their results) only.
const MEMBER_HREFS = new Set([
  "/dashboard/assessments",
]);

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/organizations", label: "Organizations", icon: Building2 },
  { href: "/dashboard/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/dashboard/questions", label: "Question Bank", icon: BookOpen },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/consultants", label: "Consultant Access", icon: UserCog },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, disabled: true },
];

async function handleSignOut() {
  clearAppToken();
  try {
    await signOut();
  } catch {
    /* app-token session or dev mode — nothing to sign out of via MSAL */
  }
  if (typeof window !== "undefined") window.location.href = "/login";
}

export function Sidebar() {
  const path = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const me = useMe();

  const visibleNav = !me || me.role === "ADMINISTRATOR"
    ? nav
    : nav.filter((n) => (me.role === "ASSESSMENT_CONSULTANT" ? CONSULTANT_HREFS : MEMBER_HREFS).has(n.href));

  useEffect(() => { setMobileOpen(false); }, [path]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 rounded-md p-2 bg-blue-dark text-white shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-blue-dark transition-all duration-200",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0 w-sidebar" : "-translate-x-full md:translate-x-0",
          // Desktop: full or collapsed width
          collapsed ? "md:w-16" : "md:w-sidebar",
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-white/10 transition-all duration-200",
          collapsed ? "md:justify-center px-0 py-5" : "px-6 py-5 justify-between",
        )}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-white font-semibold text-lg tracking-tight">Xebia</span>
              <p className="text-white/50 text-xs mt-0.5">AI Maturity Platform</p>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={toggle}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile close */}
          <button
            className="md:hidden text-white/60 hover:text-white ml-2"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ href, label, icon: Icon, disabled }) => {
            const active = path === href || path.startsWith(href + "/");
            const baseClass = cn(
              "flex items-center rounded-md py-2.5 text-sm transition-colors",
              collapsed ? "md:justify-center px-0 w-full" : "gap-3 px-3",
              disabled
                ? "text-white/30 cursor-not-allowed"
                : active
                  ? "bg-velvet text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
            );

            const content = (
              <>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="md:block">{label}</span>}
                {collapsed && (
                  <span className="md:hidden">{label}</span>
                )}
              </>
            );

            if (disabled) return <span key={href} className={baseClass} title={label}>{content}</span>;

            return (
              <Link
                key={href}
                href={href}
                className={baseClass}
                title={collapsed ? label : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-2 pb-4 border-t border-white/10 pt-4">
          <button
            onClick={() => handleSignOut()}
            className={cn(
              "flex w-full items-center rounded-md py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors",
              collapsed ? "md:justify-center px-0" : "gap-3 px-3",
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="md:block">Sign out</span>}
            {collapsed && <span className="md:hidden">Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
