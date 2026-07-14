const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Thin fetch wrapper for the HealthSync API.
 * - Attaches the access token (if present) as a Bearer token.
 * - Sends cookies (`credentials: "include"`) so the HttpOnly refresh-token
 *   cookie set by /auth/login and /auth/refresh is included automatically.
 * - Always parses JSON and throws an Error with the backend's message on
 *   failure, so callers can just try/catch and show err.message.
 *
 * Backend responses are wrapped as { success, statusCode, message, data }
 * on success, or { success: false, message, errors: [{field, message}] }
 * on failure (see Backend/src/utils/ApiResponse.js and ApiError.js).
 */
async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Please check your connection and try again.");
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response body, fall through with payload = null
  }

  if (!res.ok || payload?.success === false) {
    const firstFieldError = payload?.errors?.[0]?.message || payload?.errors?.[0];
    const message = firstFieldError || payload?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload;
}

export const authApi = {
  // Patient registration lives at the plain /register endpoint (the
  // teammate's original patient-only route); hospital gets its own path.
  registerPatient: (payload) => request("/auth/register", { method: "POST", body: payload }),
  registerHospital: (payload) => request("/auth/register/hospital", { method: "POST", body: payload }),
  // `role` must be 'user' (patient) or 'hospital'.
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  refresh: () => request("/auth/refresh", { method: "POST" }),
  logout: (token) => request("/auth/logout", { method: "POST", token }),
  me: (token) => request("/auth/me", { token }),
};
