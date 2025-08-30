import axios from "axios";
import {
    getRefreshToken,
    refreshAccessToken,
    clearAuth,
    getValidAccessToken,
} from "./auth";

// Create a shared axios instance
const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
});

// Attach Authorization header, proactively refreshing if needed
api.interceptors.request.use(async (config) => {
    const token = await getValidAccessToken();
    if (token) {
        config.headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

// Refresh lock to prevent multiple refresh calls
let refreshingPromise = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error || {};
        if (!response) return Promise.reject(error);

        // If unauthorized, try refresh once per request
        if (response.status === 401 && !config.__isRetryRequest) {
            if (!getRefreshToken()) {
                // No refresh token; clear and reject
                clearAuth();
                return Promise.reject(error);
            }

            // Start a single refresh for parallel 401s
            if (!refreshingPromise) {
                refreshingPromise = refreshAccessToken().finally(() => {
                    refreshingPromise = null;
                });
            }

            const newAccess = await refreshingPromise;
            if (!newAccess) {
                clearAuth();
                return Promise.reject(error);
            }

            // Retry original request with new token
            const retryCfg = {
                ...config,
                __isRetryRequest: true,
                headers: {
                    ...(config.headers || {}),
                    Authorization: `Bearer ${newAccess}`,
                },
            };
            return api.request(retryCfg);
        }

        return Promise.reject(error);
    }
);

export default api;
// Optional: export for ad-hoc calls (already default)

