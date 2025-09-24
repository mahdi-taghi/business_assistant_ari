import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const ACCESS_TOKEN_KEY = "chatbot-ui.access-token";
const REFRESH_TOKEN_KEY = "chatbot-ui.refresh-token";

const AuthContext = createContext(null);

function getStoredToken(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("Unable to read token from storage", error);
    return null;
  }
}

function persistToken(key, value) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("Unable to persist token", error);
  }
}

async function performRequest(path, { method = "GET", body, headers, token } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const requestHeaders = new Headers(headers || {});
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return text;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = !!user && !!accessToken;

  const clearState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    persistToken(ACCESS_TOKEN_KEY, null);
    persistToken(REFRESH_TOKEN_KEY, null);
  }, []);

  const fetchCurrentUser = useCallback(async (token) => {
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const data = await performRequest("/auth/me/", {
        method: "GET",
        token,
      });
      setUser(data);
      return data;
    } catch (error) {
      console.error("Failed to load current user", error);
      setUser(null);
      return null;
    }
  }, []);

  const refreshAccessToken = useCallback(async (currentRefresh) => {
    const tokenToUse = currentRefresh || refreshToken;
    if (!tokenToUse) {
      clearState();
      return null;
    }

    try {
      const data = await performRequest("/auth/refresh/", {
        method: "POST",
        body: { refresh: tokenToUse },
      });

      if (data?.access) {
        setAccessToken(data.access);
        persistToken(ACCESS_TOKEN_KEY, data.access);
        if (data.refresh) {
          setRefreshToken(data.refresh);
          persistToken(REFRESH_TOKEN_KEY, data.refresh);
        }
        return data.access;
      }
    } catch (error) {
      console.error("Unable to refresh access token", error);
    }

    clearState();
    return null;
  }, [clearState, refreshToken]);

  const initialize = useCallback(async () => {
    const storedAccess = getStoredToken(ACCESS_TOKEN_KEY);
    const storedRefresh = getStoredToken(REFRESH_TOKEN_KEY);

    if (!storedAccess && !storedRefresh) {
      setInitializing(false);
      return;
    }

    if (storedAccess) {
      setAccessToken(storedAccess);
    }
    if (storedRefresh) {
      setRefreshToken(storedRefresh);
    }

    const effectiveAccess = storedAccess || (storedRefresh ? await refreshAccessToken(storedRefresh) : null);
    if (!effectiveAccess) {
      setInitializing(false);
      return;
    }

    await fetchCurrentUser(effectiveAccess);
    setInitializing(false);
  }, [fetchCurrentUser, refreshAccessToken]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const authenticatedRequest = useCallback(async (path, options = {}) => {
    let tokenToUse = accessToken;

    const makeCall = async (token) => {
      const response = await fetch(
        path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
        {
          method: options.method || "GET",
          headers: {
            "Content-Type": options.body ? "application/json" : undefined,
            ...(options.headers || {}),
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        }
      );

      if (response.status === 204) {
        return { ok: true, data: null, status: 204 };
      }

      let data;
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          data = text;
        }
      }

      return { ok: response.ok, data, status: response.status };
    };

    let result = await makeCall(tokenToUse);
    if (result.status === 401) {
      tokenToUse = await refreshAccessToken();
      if (!tokenToUse) {
        return result;
      }
      result = await makeCall(tokenToUse);
    }

    if (result.ok && tokenToUse && tokenToUse !== accessToken) {
      setAccessToken(tokenToUse);
      persistToken(ACCESS_TOKEN_KEY, tokenToUse);
    }

    return result;
  }, [accessToken, refreshAccessToken]);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await performRequest("/auth/login/", {
        method: "POST",
        body: { email, password },
      });

      if (!data?.access || !data?.refresh) {
        throw new Error("Login failed");
      }

      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      persistToken(ACCESS_TOKEN_KEY, data.access);
      persistToken(REFRESH_TOKEN_KEY, data.refresh);

      const profile = await fetchCurrentUser(data.access);
      return profile;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const response = await performRequest("/auth/register/", {
        method: "POST",
        body: payload,
      });

      // Don't automatically login after registration
      // User needs to verify email first
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await performRequest("/auth/logout/", {
          method: "POST",
          body: { refresh: refreshToken },
          token: accessToken,
        });
      }
    } catch (error) {
      console.warn("Logout request failed", error);
    } finally {
      clearState();
    }
  }, [accessToken, refreshToken, clearState]);

  const updateProfile = useCallback(async (patch) => {
    const result = await authenticatedRequest("/auth/me/", {
      method: "PATCH",
      body: patch,
    });

    if (result.ok) {
      setUser(result.data);
    }

    return result;
  }, [authenticatedRequest]);

  const resendVerification = useCallback(async () => {
    try {
      const result = await authenticatedRequest("/auth/resend-verification/", {
        method: "POST",
      });
      return result;
    } catch (error) {
      console.error("Failed to resend verification", error);
      throw error;
    }
  }, [authenticatedRequest]);

  const isEmailVerified = useMemo(() => {
    return user?.security?.email_verified || false;
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    initializing,
    isAuthenticated,
    isEmailVerified,
    login,
    register,
    logout,
    refreshUser: () => fetchCurrentUser(accessToken),
    updateProfile,
    resendVerification,
    authenticatedRequest,
  }), [
    user,
    loading,
    initializing,
    isAuthenticated,
    isEmailVerified,
    login,
    register,
    logout,
    fetchCurrentUser,
    accessToken,
    updateProfile,
    resendVerification,
    authenticatedRequest,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
