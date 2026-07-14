const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Thin fetch wrapper for the HealthSync API.
 * - Attaches the JWT (if present) as a Bearer token.
 * - Always parses JSON and throws an Error with the backend's message on failure,
 *   so callers can just try/catch and show err.message.
 */
async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Please check your connection and try again.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response body, fall through with data = null
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export const authApi = {
  registerPatient: (payload) => request("/auth/register/patient", { method: "POST", body: payload }),
  registerHospital: (payload) => request("/auth/register/hospital", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
};
