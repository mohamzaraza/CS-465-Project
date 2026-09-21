import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/authMiddleware.js";

function run(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  const next = vi.fn();

  authenticateToken(req, res, next);
  return { req, res, next };
}

function sign(payload, options) {
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

describe("authenticateToken", () => {
  let logSpies;

  beforeEach(() => {
    logSpies = ["log", "info", "warn", "error", "debug"].map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {})
    );
  });

  afterEach(() => {
    // Headers and tokens are credentials: no outcome may write to the log.
    for (const spy of logSpies) {
      expect(spy).not.toHaveBeenCalled();
    }
    vi.restoreAllMocks();
  });

  it("accepts a valid token and exposes its payload as req.user", () => {
    const { req, res, next } = run(`Bearer ${sign({ id: 7, email: "a@b.co" })}`);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 7, email: "a@b.co" });
  });

  it("answers 401 when the header is missing", () => {
    const { res, next } = run(undefined);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing or malformed authorization header." });
  });

  it.each(["Bearer", "Bearer ", "Token abc", "abc", "Bearer a b"])(
    "answers 401 for the malformed header %j",
    (header) => {
      const { res, next } = run(header);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing or malformed authorization header.",
      });
    }
  );

  it("answers 401 for a token signed with another secret", () => {
    const forged = jwt.sign({ id: 7 }, "not-the-server-secret");
    const { res, next } = run(`Bearer ${forged}`);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token." });
  });

  it("answers 401 with a session message for an expired token", () => {
    const expired = sign({ id: 7, exp: Math.floor(Date.now() / 1000) - 60 });
    const { res, next } = run(`Bearer ${expired}`);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Your session has expired. Please log in again.",
    });
  });
});
