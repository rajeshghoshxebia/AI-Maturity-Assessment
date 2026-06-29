"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex flex-col min-h-screen transition-all duration-200 ${
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
      <div className="min-h-screen bg-grey-50">
        <Sidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
