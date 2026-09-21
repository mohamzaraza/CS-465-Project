import { createContext } from "react";

// Lives apart from AuthContext.jsx so that file exports only a component,
// which Fast Refresh needs in order to hot-swap it without a full reload.
export const AuthContext = createContext(null);
