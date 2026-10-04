"use client";

// Client-side guard against browser extensions injecting attributes (bis_skin_checked, cz-shortcut-listen, etc.)
// that trigger Next.js development hydration error overlays.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("hydration-mismatch") ||
      msg.includes("hydrated but some attributes") ||
      msg.includes("bis_skin_checked") ||
      msg.includes("cz-shortcut-listen") ||
      msg.includes("__processed_")
    ) {
      // Suppress extension-injected hydration warnings from popping up as full-screen overlays in dev
      return;
    }
    originalError.apply(console, args);
  };
}

export default function HydrationGuard() {
  return null;
}
