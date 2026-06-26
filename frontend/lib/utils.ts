import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maturityBadgeClass(label: string): string {
  const map: Record<string, string> = {
    Planning: "maturity-planning",
    Experimenting: "maturity-experimenting",
    Standardizing: "maturity-standardizing",
    Scaling: "maturity-scaling",
    Optimizing: "maturity-optimizing",
  };
  return map[label] ?? "maturity-planning";
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}
