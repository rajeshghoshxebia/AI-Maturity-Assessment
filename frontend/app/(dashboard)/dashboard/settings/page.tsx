"use client";

import { useEffect, useState } from "react";
import { Check, MoonStar, SunMedium } from "lucide-react";
import { applyTheme, getStoredTheme, getSystemTheme, type ThemeMode } from "@/lib/theme";

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof SunMedium;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Bright interface with the Xebia violet accents.",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-light styling for evening sessions and presentations.",
    icon: MoonStar,
  },
];

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const currentTheme = storedTheme ?? getSystemTheme();
    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, []);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-velvet">Preferences</p>
        <h2 className="mt-2 text-2xl font-semibold text-grey-900 dark:text-white">Appearance</h2>
        <p className="mt-2 text-sm text-grey-500 dark:text-grey-400">
          Choose the look and feel for the platform. The experience stays aligned with the Xebia brand palette and typography.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-grey-200 bg-white p-6 shadow-card dark:border-grey-800 dark:bg-grey-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-grey-900 dark:text-white">Theme mode</h3>
              <p className="mt-1 text-sm text-grey-500 dark:text-grey-400">
                Switch between light and dark displays for the dashboard experience.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-velvet bg-velvet-subtle text-velvet dark:border-velvet-light dark:bg-[#261038]"
                      : "border-grey-200 bg-white text-grey-700 hover:border-velvet-light hover:bg-grey-50 dark:border-grey-800 dark:bg-grey-800 dark:text-grey-200 dark:hover:border-velvet-light"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-velvet shadow-sm dark:bg-grey-900">
                      <Icon className="h-5 w-5" />
                    </span>
                    {selected && <Check className="h-4 w-4" />}
                  </div>
                  <p className="mt-4 font-semibold">{option.label}</p>
                  <p className="mt-1 text-sm opacity-80">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-grey-200 bg-velvet-subtle p-6 shadow-card dark:border-grey-800 dark:bg-[#18061F]">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-velvet">Preview</p>
          <div className="mt-4 rounded-2xl border border-white/70 bg-white p-4 shadow-sm dark:border-grey-800 dark:bg-grey-900">
            <div className="flex items-center justify-between border-b border-grey-100 pb-3 dark:border-grey-800">
              <div>
                <p className="text-sm font-semibold text-grey-900 dark:text-white">Xebia AI Maturity</p>
                <p className="text-xs text-grey-500 dark:text-grey-400">Executive overview</p>
              </div>
              <span className="rounded-full bg-velvet-subtle px-2.5 py-1 text-xs font-medium text-velvet dark:bg-[#2A1238]">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-lg bg-grey-50 p-3 dark:bg-grey-800">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-grey-500 dark:text-grey-400">Readiness</p>
                <p className="mt-1 text-lg font-semibold text-grey-900 dark:text-white">82% aligned</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-grey-200 px-3 py-2 dark:border-grey-800">
                <span className="text-sm text-grey-600 dark:text-grey-300">Theme preview</span>
                <span className="text-sm font-medium text-velvet">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
