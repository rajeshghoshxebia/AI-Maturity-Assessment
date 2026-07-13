"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { isAdmin, useMe } from "@/lib/use-me";

const ADMIN_ONLY_PATHS = ["/dashboard/questions", "/dashboard/users", "/dashboard/consultants", "/dashboard/settings"];

function isAdminOnlyRoute(pathname: string) {
  return ADMIN_ONLY_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function DashboardAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const admin = isAdmin(me);

  useEffect(() => {
    if (!me) return;
    if (isAdminOnlyRoute(pathname) && !admin) {
      router.replace("/dashboard/assessments");
    }
  }, [admin, me, pathname, router]);

  if (!me) return null;
  if (isAdminOnlyRoute(pathname) && !admin) return null;

  return <>{children}</>;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex min-h-screen flex-col bg-grey-50 transition-all duration-200 dark:bg-[#0b0710] ${
        collapsed ? "md:ml-16" : "md:ml-sidebar"
      }`}
    >
      <Topbar />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-grey-50 dark:bg-[#0b0710]">
        <Sidebar />
        <DashboardAccessGate>
          <DashboardContent>{children}</DashboardContent>
        </DashboardAccessGate>
      </div>
    </SidebarProvider>
  );
}
