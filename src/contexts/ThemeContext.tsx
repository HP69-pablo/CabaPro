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

  // Apply the .dark class (brand colors are defined in globals.css via CSS variables)
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = mode === "dark" || (mode === "system" && media.matches);
      root.classList.toggle("dark", isDark);
    };
    apply();

    try {
      localStorage.setItem("caba_pro_theme_mode", mode);
    } catch (e) {
      console.warn("Failed to save theme mode to localStorage", e);
    }

    if (mode === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
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
