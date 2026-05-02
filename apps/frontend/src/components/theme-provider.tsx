"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" themes={["light", "dark"]}>
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return {
    theme: theme as "light" | "dark",
    setTheme: (newTheme: "light" | "dark") => setTheme(newTheme),
    toggleTheme
  };
}
