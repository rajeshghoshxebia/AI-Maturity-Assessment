import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maturityBadgeClass(label: string): string {
  const map: Record<string, string> = {
    Initial: "maturity-initial",
    Developing: "maturity-developing",
    Managed: "maturity-managed",
    Advanced: "maturity-advanced",
    Optimized: "maturity-optimized",
  };
  return map[label] ?? "maturity-initial";
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}
