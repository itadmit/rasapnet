const API_BASE = "";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

function getTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  };
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth) {
    const { accessToken } = getTokens();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // If 401, try refresh
  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const { accessToken } = getTokens();
      headers.set("Authorization", `Bearer ${accessToken}`);
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "שגיאת שרת" }));
    throw new Error(error.error || "שגיאה לא צפויה");
  }

  return res.json();
}
