import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../lib/api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "healthsync_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(true);

  // Persist to localStorage whenever auth state changes
  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, user]);

  // Validate the stored token against the backend on first load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.me(token);
        if (!cancelled) setAuth({ token, user: data.user });
      } catch {
        if (!cancelled) setAuth({ token: null, user: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerPatient = async (payload) => {
    const data = await authApi.registerPatient(payload);
    setAuth({ token: data.token, user: data.user });
    return data;
  };

  const registerHospital = async (payload) => {
    const data = await authApi.registerHospital(payload);
    setAuth({ token: data.token, user: data.user });
    return data;
  };

  const login = async (payload) => {
    const data = await authApi.login(payload);
    setAuth({ token: data.token, user: data.user });
    return data;
  };

  const logout = () => setAuth({ token: null, user: null });

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(token),
      loading,
      registerPatient,
      registerHospital,
      login,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
