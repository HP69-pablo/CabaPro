import { describe, it, expect } from "vitest";
import { app, db, auth, storage } from "@/lib/firebase";

describe("Firebase Setup", () => {
  it("should initialize Firebase App with the user's config", () => {
    expect(app).toBeDefined();
    expect(app.options.projectId).toBe("ai-studio-applet-webapp-17af3");
    expect(app.options.authDomain).toBe("ai-studio-applet-webapp-17af3.firebaseapp.com");
    expect(app.options.storageBucket).toBe("ai-studio-applet-webapp-17af3.firebasestorage.app");
  });

  it("should export db, auth, and storage singletons", () => {
    expect(db).toBeDefined();
    expect(auth).toBeDefined();
    expect(storage).toBeDefined();
  });
});
