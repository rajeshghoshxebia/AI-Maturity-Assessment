"use client";

import { Bell } from "lucide-react";
import { getActiveAccount } from "@/lib/auth";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const account = getActiveAccount();
  const initials = account?.name
    ? account.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="topbar">
      {title && (
        <h1 className="text-base font-semibold text-grey-900 flex-1">{title}</h1>
      )}
      {!title && <div className="flex-1" />}

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="text-grey-500 hover:text-grey-900 transition-colors"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div
          className="h-8 w-8 rounded-full bg-velvet flex items-center justify-center text-white text-xs font-semibold"
          title={account?.name ?? "User"}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
