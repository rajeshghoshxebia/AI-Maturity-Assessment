export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "app-theme";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
}

export function initializeTheme(): ThemeMode {
  const storedTheme = getStoredTheme();
  const theme = storedTheme ?? getSystemTheme();
  applyTheme(theme);
  return theme;
}
