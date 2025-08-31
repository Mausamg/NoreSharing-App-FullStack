// Centralized auth helpers for consistent token handling

export const getAccessToken = () => {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        null
    );
};

export const authHeader = () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getRefreshToken = () => {
    return (
        localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken") ||
        null
    );
};

// Attempt to refresh the access token using the stored refresh token
export const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
        const res = await fetch("https://noresharing-app-fullstack-2.onrender.com/api/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newAccess = data?.access;
        if (newAccess) {
            // store alongside the refresh token location
            if (localStorage.getItem("refreshToken")) {
                localStorage.setItem("accessToken", newAccess);
            } else {
                sessionStorage.setItem("accessToken", newAccess);
            }
            return newAccess;
        }
        return null;
    } catch {
        return null;
    }
};

export const clearAuth = () => {
    [
        "accessToken",
        "refreshToken",
        "currentUser",
        // legacy key intentionally left out of retrieval, but we still clear it
        "token",
    ].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
    });
};

// --- JWT helpers and proactive refresh ---

// Safely decode JWT without verifying signature (client-side only)
export const decodeJwt = (token) => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const json = atob(payload);
        return JSON.parse(json);
    } catch {
        return null;
    }
};

// Check if a token is expired (with a small clock skew buffer)
export const isTokenExpired = (token, skewSeconds = 30) => {
    if (!token) return true;
    const data = decodeJwt(token);
    if (!data?.exp) return false; // if no exp, assume non-expiring
    const now = Math.floor(Date.now() / 1000);
    return now >= (Number(data.exp) - skewSeconds);
};

// Get a valid access token; refresh if needed and possible
export const getValidAccessToken = async () => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) return token;
    // try to refresh
    const newAccess = await refreshAccessToken();
    return newAccess || null;
};
