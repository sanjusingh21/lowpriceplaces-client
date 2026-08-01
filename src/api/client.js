const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:5000/api";
  }
  return "/api";
};

export const API_BASE = getApiBase();

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lowpriceplaces_token");
  }
  return null;
}

export function setAuthToken(token) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("lowpriceplaces_token", token);
    } else {
      localStorage.removeItem("lowpriceplaces_token");
    }
  }
}

export function getCurrentUser() {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("lowpriceplaces_user");
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function setCurrentUser(user) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("lowpriceplaces_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("lowpriceplaces_user");
    }
  }
}

export function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}

// Request Helper
export async function request(endpoint, options = {}, isRetry = false) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (options.body && typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      cache: "no-store",
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Network error occurred.");
    }
    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      if (!isRetry) {
        await new Promise((r) => setTimeout(r, 500));
        return request(endpoint, options, true);
      }
      throw new Error(
        "Unable to connect to the backend server (http://localhost:5000). Please ensure the backend server is running.",
      );
    }
    throw err;
  }
}
