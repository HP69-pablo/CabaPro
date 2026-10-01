import { describe, it, expect } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import ar from "../../../messages/ar.json";

function getKeys(obj: any, prefix = ""): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n Translations Consistency", () => {
  const enKeys = getKeys(en).sort();
  const frKeys = getKeys(fr).sort();
  const arKeys = getKeys(ar).sort();

  it("should have identical translation keys between English and French", () => {
    expect(frKeys).toEqual(enKeys);
  });

  it("should have identical translation keys between English and Arabic", () => {
    expect(arKeys).toEqual(enKeys);
  });

  it("should contain all critical sections in all translations", () => {
    const sections = ["common", "nav", "auth", "landing", "request", "trip", "dashboard", "chat", "profile"];
    for (const section of sections) {
      expect(en).toHaveProperty(section);
      expect(fr).toHaveProperty(section);
      expect(ar).toHaveProperty(section);
    }
  });

  it("should have non-empty translation strings", () => {
    function assertNoEmptyValues(obj: any, path = "") {
      for (const [key, val] of Object.entries(obj)) {
        const curPath = path ? `${path}.${key}` : key;
        if (typeof val === "object" && val !== null) {
          assertNoEmptyValues(val, curPath);
        } else {
          expect(typeof val).toBe("string");
          expect((val as string).trim().length).toBeGreaterThan(0);
        }
      }
    }

    assertNoEmptyValues(en);
    assertNoEmptyValues(fr);
    assertNoEmptyValues(ar);
  });
});
