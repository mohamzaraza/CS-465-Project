// Every access is guarded because localStorage can throw outright (storage
// disabled, some private modes, quota full) and a stored value may not be
// valid JSON. Either case should behave like "nothing stored", never crash.
export const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Nothing to fall back to; the value just won't survive a reload.
    }
  },
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // If storage is unreachable there is nothing left to remove.
    }
  }
};