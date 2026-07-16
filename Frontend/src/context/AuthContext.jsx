import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../lib/api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "healthsync_auth";

// The UI/routes use 'patient' | 'hospital'. The backend (Backend/src/constants/roles.js)
// uses 'user' | 'hospital'. Translate at the API boundary so the rest of the
// app can keep using the friendlier 'patient' term.
const toApiRole = (appRole) => (appRole === "hospital" ? "hospital" : "user");
const toAppRole = (apiRole) => (apiRole === "hospital" ? "hospital" : "patient");

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { accessToken: null, user: null, role: null };
  } catch {
    return { accessToken: null, user: null, role: null };
  }
}

export function AuthProvider({ children }) {
  const [{ accessToken, user, role }, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(true);

  // Persist to localStorage whenever auth state changes.
  // Note: the refresh token itself is an HttpOnly cookie set by the backend —
  // it's never accessible to JS and isn't stored here.
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, user, role }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [accessToken, user, role]);

  // On first load: validate any stored access token, and if that fails
  // (expired — access tokens only last 15 minutes), try a silent refresh
  // using the HttpOnly refresh-token cookie before giving up.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const stored = readStoredAuth();

      if (stored.accessToken) {
        try {
          const data = await authApi.me(stored.accessToken);
          if (!cancelled) setAuth({ accessToken: stored.accessToken, user: data.data, role: toAppRole(data.data.role) });
          return;
        } catch {
          // fall through to silent refresh
        }
      }

      try {
        const refreshed = await authApi.refresh();
        const newToken = refreshed.data.accessToken;
        const me = await authApi.me(newToken);
        if (!cancelled) setAuth({ accessToken: newToken, user: me.data, role: toAppRole(me.data.role) });
      } catch {
        if (!cancelled) setAuth({ accessToken: null, user: null, role: null });
      }
    };

    restoreSession().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Registration only creates the account (Backend/src/services/auth.service.js
  // register() does not issue tokens) — we deliberately do NOT log the user in
  // afterwards. The signup page sends them to /login instead, so they land on
  // a clean, explicit sign-in step (and so email verification, if enforced,
  // is handled by the normal login flow rather than being masked behind an
  // auto-login attempt).
  const registerPatient = (payload) => authApi.registerPatient(payload);

  const registerHospital = (payload) => authApi.registerHospital(payload);

  const login = async ({ email, password, appRole }) => {
    const data = await authApi.login({ email, password, role: toApiRole(appRole) });
    const nextAccessToken = data.data.accessToken;
    const nextUser = data.data.user;
    setAuth({ accessToken: nextAccessToken, user: nextUser, role: toAppRole(nextUser.role) });
    return data;
  };

  const logout = async () => {
    try {
      if (accessToken) await authApi.logout(accessToken);
    } catch {
      // best-effort — clear local session regardless
    }
    setAuth({ accessToken: null, user: null, role: null });
  };

  const value = useMemo(
    () => ({
      accessToken,
      user,
      role,
      isAuthenticated: Boolean(accessToken),
      loading,
      registerPatient,
      registerHospital,
      login,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
