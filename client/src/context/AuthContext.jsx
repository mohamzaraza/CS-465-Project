import { useCallback, useEffect, useRef, useState } from "react";
import { AuthContext } from "./authContextObject";
import { apiRequest, setUnauthorizedHandler, TOKEN_KEY } from "../lib/api";
import { storage } from "../utils/storage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This provider is rendered above <Router> (see main.jsx), so it cannot call
  // useNavigate. AuthNavigator, rendered inside the router, lends it navigate.
  const navigateRef = useRef(null);
  const registerNavigate = useCallback((navigate) => {
    navigateRef.current = navigate;
  }, []);

  const logout = useCallback(() => {
    storage.remove(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      // During the initial /me check the router is not mounted yet, so there is
      // no navigate and a stale token is simply dropped, as it was before.
      navigateRef.current?.("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    async function loadUser() {
      if (!storage.get(TOKEN_KEY)) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me");
        setUser(data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    storage.set(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    (email, password) =>
      apiRequest("/auth/register", {
        method: "POST",
        body: { email, password },
      }),
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, registerNavigate }}
    >
      {children}
    </AuthContext.Provider>
  );
}
