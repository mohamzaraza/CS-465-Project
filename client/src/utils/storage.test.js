import { describe, it, expect, vi, afterEach } from "vitest";
import { storage } from "./storage";

describe("storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips JSON values and removes them", () => {
    storage.set("prefs", { unit: "kg" });
    expect(storage.get("prefs")).toEqual({ unit: "kg" });

    storage.remove("prefs");
    expect(storage.get("prefs")).toBeNull();
  });

  it("returns null for a value that is not valid JSON", () => {
    localStorage.setItem("token", "raw.jwt.value");
    expect(storage.get("token")).toBeNull();
  });

  it("does not throw when the browser blocks storage", () => {
    const blocked = () => {
      throw new DOMException("Access is denied", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);

    expect(() => storage.set("token", "abc")).not.toThrow();
    expect(storage.get("token")).toBeNull();
    expect(() => storage.remove("token")).not.toThrow();
  });
});
