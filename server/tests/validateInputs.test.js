import { describe, it, expect } from "vitest";
import {
  validateChatMessage,
  validateLogin,
  validateRegistration,
} from "../utils/validateInputs.js";
import { CHAT_MAX_LENGTH } from "../config/constants.js";

describe("validateRegistration", () => {
  it("accepts a valid email and password", () => {
    expect(validateRegistration({ email: "a@b.co", password: "longenough" })).toBeNull();
  });

  it.each([
    ["no body", undefined],
    ["missing email", { password: "longenough" }],
    ["missing password", { email: "a@b.co" }],
    ["non-string email", { email: ["a@b.co"], password: "longenough" }],
  ])("requires both fields (%s)", (_name, body) => {
    expect(validateRegistration(body)).toBe("Email and password are required.");
  });

  it.each(["plainaddress", "a@b", "@b.co", "a b@c.co", `${"x".repeat(250)}@b.co`])(
    "rejects the email %s",
    (email) => {
      expect(validateRegistration({ email, password: "longenough" })).toBe(
        "Enter a valid email address."
      );
    }
  );

  it("rejects a password shorter than 8 characters", () => {
    expect(validateRegistration({ email: "a@b.co", password: "1234567" })).toMatch(/at least 8/);
    expect(validateRegistration({ email: "a@b.co", password: "12345678" })).toBeNull();
  });

  it("limits passwords to 72 bytes, not 72 characters", () => {
    expect(validateRegistration({ email: "a@b.co", password: "x".repeat(72) })).toBeNull();
    expect(validateRegistration({ email: "a@b.co", password: "x".repeat(73) })).toMatch(/72 bytes/);
    // 37 two-byte characters = 74 bytes, although only 37 characters long.
    expect(validateRegistration({ email: "a@b.co", password: "é".repeat(37) })).toMatch(/72 bytes/);
  });
});

describe("validateLogin", () => {
  it("accepts any non-empty email and password, including short legacy passwords", () => {
    expect(validateLogin({ email: "a@b.co", password: "short" })).toBeNull();
  });

  it.each([undefined, {}, { email: "a@b.co" }, { email: "", password: "x" }, { email: 1, password: "x" }])(
    "rejects %j",
    (body) => {
      expect(validateLogin(body)).toBe("Email and password are required.");
    }
  );
});

describe("validateChatMessage", () => {
  it("accepts a normal message and one at the maximum length", () => {
    expect(validateChatMessage("How do I bench more?")).toBeNull();
    expect(validateChatMessage("x".repeat(CHAT_MAX_LENGTH))).toBeNull();
  });

  it.each([undefined, null, 42, "", "   \n\t"])("rejects %j as empty", (message) => {
    expect(validateChatMessage(message)).toBe("Message is required.");
  });

  it("rejects a message over the maximum length", () => {
    expect(validateChatMessage("x".repeat(CHAT_MAX_LENGTH + 1))).toBe(
      `Message must be at most ${CHAT_MAX_LENGTH} characters.`
    );
  });
});
