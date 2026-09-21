// Tunable limits get names here so each reason is written down once and the
// controllers, routes and tests all use the same value.

// A user may re-rank a muscle only this often, so scores reflect training
// progress rather than repeated attempts.
export const RANK_COOLDOWN_HOURS = 12;
export const MS_PER_HOUR = 60 * 60 * 1000;

// Cost factor for password hashes: each step doubles the work for an attacker
// and for our login endpoint alike.
export const BCRYPT_ROUNDS = 12;

export const JWT_EXPIRES_IN = "7d";

// Every KevAi message is forwarded to a paid model, so both its size and its
// frequency are capped per user.
export const CHAT_MAX_LENGTH = 1000;
export const KEVAI_RATE_LIMIT_MAX = 30;
export const KEVAI_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
