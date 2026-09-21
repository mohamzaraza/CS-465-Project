import { API_URL } from "../config/env";
import { storage } from "../utils/storage";

export const DEFAULT_TIMEOUT_MS = 10_000;

// The key the auth context stores the login token under; api.js reads it
// directly so callers never have to pass the token around.
export const TOKEN_KEY = "token";

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, code = "HTTP" } = {}) {
    super(message);
    this.name = "ApiError";
    // status is 0 when no HTTP response arrived (timeout, network, config).
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

let unauthorizedHandler = null;

// The auth context sits above the router and owns the session, so it hands
// api.js a callback instead of api.js reaching into React state.
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

// Error bodies are not guaranteed to be JSON (a proxy or crashed server can
// return an HTML page), so fall back to the raw text instead of throwing.
function parseErrorBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(status, data) {
  if (data && typeof data === "object") {
    if (typeof data.error === "string" && data.error) return data.error;
    if (typeof data.message === "string" && data.message) return data.message;
  }
  if (status === 401) return "Please log in to continue.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That could not be found.";
  if (status >= 500) return "The server ran into a problem. Please try again later.";
  return `Request failed (${status}).`;
}

export async function apiRequest(
  path,
  { method = "GET", body, headers, timeout = DEFAULT_TIMEOUT_MS } = {}
) {
  if (!API_URL) {
    throw new ApiError(
      "This build of LiftLogic has no server address configured (VITE_API_URL was not set when it was built).",
      { code: "CONFIG" }
    );
  }

  const token = storage.get(TOKEN_KEY);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  let text;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    // Reading the body stays inside the timeout so a stalled stream is caught too.
    text = await res.text();
  } catch (err) {
    if (controller.signal.aborted) {
      throw new ApiError("The server took too long to respond. Please try again.", {
        code: "TIMEOUT",
      });
    }
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      { code: "NETWORK", data: err }
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const data = parseErrorBody(text);
    // Only a request that carried a token means "your session is no longer
    // valid". A 401 without one is e.g. a wrong password on /auth/login,
    // which the login form must show instead of being redirected away.
    if (res.status === 401 && token && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiError(errorMessage(res.status, data), { status: res.status, data });
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // A 200 with HTML usually means the URL hit something other than the API
    // (for example the static site itself), so callers must not treat it as data.
    throw new ApiError("The server sent an unexpected response.", {
      status: res.status,
      data: text,
      code: "BAD_RESPONSE",
    });
  }
}
