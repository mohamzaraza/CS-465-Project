// The server validates for itself because the client's checks are a courtesy:
// any HTTP client can skip them.
import { CHAT_MAX_LENGTH } from "../config/constants.js";

// Each validator returns a message for the client, or null when the input is
// acceptable, so controllers can answer 400 with it directly.

// Deliberately loose: the only reliable email check is sending mail, so this
// just rejects values that cannot be an address at all.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

const PASSWORD_MIN_LENGTH = 8;
// bcrypt silently ignores everything after 72 bytes, so a longer password
// would give a false sense of strength. Bytes, not characters: accented
// letters and emoji take several bytes each.
const PASSWORD_MAX_BYTES = 72;

export function validateRegistration(body) {
  const { email, password } = body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return "Email and password are required.";
  }
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes (about ${PASSWORD_MAX_BYTES} plain characters).`;
  }
  return null;
}

// Login checks shape only: accounts created before the length rules existed
// must still be able to sign in.
export function validateLogin(body) {
  const { email, password } = body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return "Email and password are required.";
  }
  return null;
}

export function validateChatMessage(message) {
  if (typeof message !== "string" || message.trim() === "") {
    return "Message is required.";
  }
  if (message.length > CHAT_MAX_LENGTH) {
    return `Message must be at most ${CHAT_MAX_LENGTH} characters.`;
  }
  return null;
}
