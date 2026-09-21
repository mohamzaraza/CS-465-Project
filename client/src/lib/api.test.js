import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, ApiError, setUnauthorizedHandler, TOKEN_KEY } from "./api";
import { API_URL } from "../config/env";
import { storage } from "../utils/storage";

// A minimal stand-in for fetch's Response: apiRequest only uses ok, status and text().
function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  };
}

function stubFetch(impl) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiRequest", () => {
  beforeEach(() => {
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setUnauthorizedHandler(null);
  });

  it("returns parsed JSON on success and builds the URL from API_URL", async () => {
    const fetchMock = stubFetch(async () => fakeResponse(200, '{"tier":"Gold"}'));

    const data = await apiRequest("/rank/chest/me");

    expect(data).toEqual({ tier: "Gold" });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/rank/chest/me`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("sends a JSON body with the matching content type", async () => {
    const fetchMock = stubFetch(async () => fakeResponse(201, '{"message":"User created"}'));

    await apiRequest("/auth/register", { method: "POST", body: { email: "a@b.c" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"email":"a@b.c"}');
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("attaches the stored login token", async () => {
    storage.set(TOKEN_KEY, "abc.def.ghi");
    const fetchMock = stubFetch(async () => fakeResponse(200, "{}"));

    await apiRequest("/auth/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer abc.def.ghi");
  });

  it("sends no Authorization header when logged out", async () => {
    const fetchMock = stubFetch(async () => fakeResponse(200, "{}"));

    await apiRequest("/leaderboard/chest");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("turns a 400 JSON error body into an ApiError with the server's message", async () => {
    stubFetch(async () => fakeResponse(400, '{"error":"Missing fields"}'));

    const err = await apiRequest("/auth/register", { method: "POST", body: {} }).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Missing fields");
    expect(err.data).toEqual({ error: "Missing fields" });
  });

  it("uses the message field when the server sends no error field", async () => {
    stubFetch(async () => fakeResponse(409, '{"message":"Email already in use"}'));

    await expect(apiRequest("/auth/register")).rejects.toMatchObject({
      status: 409,
      message: "Email already in use",
    });
  });

  it("on a 401 with a token, reports the server's message and calls the unauthorized handler", async () => {
    storage.set(TOKEN_KEY, "expired");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    stubFetch(async () => fakeResponse(401, '{"error":"Invalid token"}'));

    await expect(apiRequest("/rank/chest/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Invalid token",
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("on a 401 without a token (wrong password), does not call the unauthorized handler", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    stubFetch(async () => fakeResponse(401, '{"error":"Invalid credentials"}'));

    await expect(apiRequest("/auth/login", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 401,
      message: "Invalid credentials",
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("handles a 500 with an HTML body without a parse error", async () => {
    const html = "<!DOCTYPE html><html><body>Internal Server Error</body></html>";
    stubFetch(async () => fakeResponse(500, html));

    const err = await apiRequest("/leaderboard/chest").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(SyntaxError);
    expect(err.status).toBe(500);
    expect(err.message).toBe("The server ran into a problem. Please try again later.");
    expect(err.data).toBe(html);
  });

  it("rejects a 200 whose body is not JSON instead of returning it as data", async () => {
    stubFetch(async () => fakeResponse(200, "<html></html>"));

    await expect(apiRequest("/leaderboard/chest")).rejects.toMatchObject({
      code: "BAD_RESPONSE",
    });
  });

  it("returns null for an empty success body", async () => {
    stubFetch(async () => fakeResponse(204, ""));

    await expect(apiRequest("/anything")).resolves.toBeNull();
  });

  it("reports a network failure with its own message", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(apiRequest("/leaderboard/chest")).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "NETWORK",
      message: "Could not reach the server. Check your connection and try again.",
    });
  });

  describe("timeouts", () => {
    // A fetch that never settles on its own and only rejects when aborted,
    // like a real request to a server that stopped answering.
    function hangingFetch() {
      return stubFetch(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () =>
              reject(new DOMException("The operation was aborted.", "AbortError"))
            );
          })
      );
    }

    it("aborts after the default 10 seconds with a timeout message", async () => {
      vi.useFakeTimers();
      hangingFetch();

      const assertion = expect(apiRequest("/leaderboard/chest")).rejects.toMatchObject({
        name: "ApiError",
        status: 0,
        code: "TIMEOUT",
        message: "The server took too long to respond. Please try again.",
      });
      await vi.advanceTimersByTimeAsync(10_000);

      await assertion;
    });

    it("honours a per-call timeout override", async () => {
      vi.useFakeTimers();
      hangingFetch();

      let settled = false;
      const request = apiRequest("/kevai", { method: "POST", body: {}, timeout: 30_000 });
      request.catch(() => {}).finally(() => {
        settled = true;
      });

      await vi.advanceTimersByTimeAsync(10_000);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(20_000);
      await expect(request).rejects.toMatchObject({ code: "TIMEOUT" });
    });
  });
});
