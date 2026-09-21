import { apiRequest, ApiError } from "./api";

// KevAi waits on an upstream language model, which is far slower than the
// app's own endpoints, so it gets a longer timeout than the default.
const KEVAI_TIMEOUT_MS = 30_000;

export async function askKevAi(message) {
  const data = await apiRequest("/kevai", {
    method: "POST",
    body: { message },
    timeout: KEVAI_TIMEOUT_MS,
  });

  // A success without a reply would otherwise render as an empty chat bubble.
  if (typeof data?.reply !== "string" || !data.reply.trim()) {
    throw new ApiError("KevAi returned an empty answer. Try again in a moment.", {
      status: 200,
      data,
      code: "BAD_RESPONSE",
    });
  }

  return data.reply;
}
