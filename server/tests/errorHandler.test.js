import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { asyncHandler, errorHandler, httpError, notFound } from "../utils/errorHandler.js";

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("errorHandler", () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("answers 500 with the message and logs the real error outside production", () => {
    const err = new Error("database exploded");
    const res = mockRes();

    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "database exploded" });
    expect(errorSpy).toHaveBeenCalledWith(err);
  });

  it("hides server error details and never sends a stack in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const err = new Error("password column missing at /srv/app/db.js:12");
    const res = mockRes();

    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({ error: "Something went wrong. Please try again later." });
    expect(JSON.stringify(body)).not.toContain("db.js");
    expect(errorSpy).toHaveBeenCalledWith(err);
  });

  it("keeps the status and message of client errors, even in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = mockRes();

    errorHandler(httpError(403, "Origin not allowed"), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Origin not allowed" });
  });

  it("turns a JSON parse failure into a readable 400", () => {
    const err = Object.assign(new SyntaxError("Unexpected token } in JSON"), {
      status: 400,
      type: "entity.parse.failed",
    });
    const res = mockRes();

    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Request body is not valid JSON." });
  });
});

describe("notFound", () => {
  it("answers 404 with a JSON error", () => {
    const res = mockRes();
    notFound({}, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
  });
});

describe("asyncHandler", () => {
  it("passes a rejected promise to next", async () => {
    const err = new Error("boom");
    const next = vi.fn();

    await asyncHandler(async () => {
      throw err;
    })({}, {}, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("does not call next when the handler succeeds", async () => {
    const next = vi.fn();
    await asyncHandler(async (req, res) => res.done)({}, { done: true }, next);
    expect(next).not.toHaveBeenCalled();
  });
});
