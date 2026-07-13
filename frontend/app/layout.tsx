import type { Metadata } from "next";
import "./globals.css";
import { initializeTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: {
    template: "%s | AI Maturity Assessment",
    default: "AI Maturity Assessment",
  },
  description: "Enterprise AI readiness assessment platform by Xebia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialTheme = initializeTheme();

  return (
    <html lang="en" suppressHydrationWarning data-theme={initialTheme}>
      <body>{children}</body>
    </html>
  );
}
