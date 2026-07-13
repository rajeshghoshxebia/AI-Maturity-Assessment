"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { getActiveAccount } from "@/lib/auth";
import { applyTheme, getStoredTheme, getSystemTheme, type ThemeMode } from "@/lib/theme";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const account = getActiveAccount();
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const currentTheme = storedTheme ?? getSystemTheme();
    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, []);

  const initials = account?.name
    ? account.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="topbar pl-14 md:pl-6">
      {title && (
        <h1 className="text-base font-semibold text-grey-900 flex-1 truncate">{title}</h1>
      )}
      {!title && <div className="flex-1" />}

      <div className="flex items-center gap-3 shrink-0">
        <button
          aria-label="Toggle theme"
          onClick={() => {
            const nextTheme = theme === "dark" ? "light" : "dark";
            setTheme(nextTheme);
            applyTheme(nextTheme);
          }}
          className="rounded-full border border-grey-200 bg-white p-2 text-grey-500 transition-colors hover:text-grey-900 dark:border-grey-700 dark:bg-grey-800 dark:text-grey-300"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          aria-label="Notifications"
          className="text-grey-500 hover:text-grey-900 transition-colors dark:text-grey-300 dark:hover:text-white"
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
