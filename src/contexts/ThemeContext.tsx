"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface BrandColors {
  primary: string; // Base / Main color (Deep Teal from mockup: #166567)
  primaryHover: string; // #11494b
  primaryLight: string; // #f0f8f8
  secondary: string; // Secondary / Bringer color (Warm Coral from mockup: #ea6a47)
  secondaryHover: string; // #d64e29
  secondaryLight: string; // #fef4f1
}

export const CABA_PRO_THEME: BrandColors = {
  primary: "#166567",
  primaryHover: "#11494b",
  primaryLight: "#f0f8f8",
  secondary: "#ea6a47",
  secondaryHover: "#d64e29",
  secondaryLight: "#fef4f1",
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: BrandColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function hexToRgb(hex: string): string {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("caba_pro_theme_mode") as ThemeMode | null;
      if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
        setModeState(stored);
      }
    } catch (e) {
      console.warn("Failed to load theme mode from localStorage", e);
    }
    setMounted(true);
  }, []);

  // Apply to DOM (both CSS variables and .dark class)
  useEffect(() => {
    const root = document.documentElement;

    // Apply the exact theme CSS variables from the mockup
    root.style.setProperty("--brand-primary", hexToRgb(CABA_PRO_THEME.primary));
    root.style.setProperty("--brand-primary-hover", hexToRgb(CABA_PRO_THEME.primaryHover));
    root.style.setProperty("--brand-primary-light", hexToRgb(CABA_PRO_THEME.primaryLight));

    root.style.setProperty("--brand-secondary", hexToRgb(CABA_PRO_THEME.secondary));
    root.style.setProperty("--brand-secondary-hover", hexToRgb(CABA_PRO_THEME.secondaryHover));
    root.style.setProperty("--brand-secondary-light", hexToRgb(CABA_PRO_THEME.secondaryLight));

    if (!mounted) return;

    // Dark Mode handling
    const isDark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem("caba_pro_theme_mode", mode);
    } catch (e) {
      console.warn("Failed to save theme mode to localStorage", e);
    }
  }, [mode, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors: CABA_PRO_THEME,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
