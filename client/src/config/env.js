// The only place the client learns the server's address, so switching between
// local and deployed servers never means editing components.
//
// Vite inlines import.meta.env at build time, so this is fixed per build and
// must be set in the environment that runs `npm run build`, not at runtime.
const configuredUrl = import.meta.env.VITE_API_URL;

// Falling back only in development keeps `npm run dev` zero-config. A production
// build without the variable is left undefined on purpose: silently pointing a
// deployed site at the visitor's own localhost would fail in a confusing way.
// apiRequest turns the missing value into a clear error on the first request,
// so pages that never call the API still render.
export const API_URL =
  configuredUrl || (import.meta.env.DEV ? "http://localhost:5000" : undefined);
