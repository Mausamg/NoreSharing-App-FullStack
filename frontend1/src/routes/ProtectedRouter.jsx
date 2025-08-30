import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { clearAuth } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const lsAccess = localStorage.getItem("accessToken");
    const ssAccess = sessionStorage.getItem("accessToken");
    const lsLegacy = localStorage.getItem("token");
    const ssLegacy = sessionStorage.getItem("token");

    const token = lsAccess || ssAccess || lsLegacy || ssLegacy || null;

    console.log("[ProtectedRoute] Tokens:", {
      lsAccess,
      ssAccess,
      lsLegacy,
      ssLegacy,
      chosen: token,
    });

    if (!token) {
      // Avoid duplicate toasts from StrictMode double-invoked effects
      const now = Date.now();
      const last = Number(sessionStorage.getItem("authToastAt") || 0);
      if (!last || now - last > 2000) {
        toast.error("You are not authenticated. Please log in.");
        sessionStorage.setItem("authToastAt", String(now));
      }
      // Clear any stale user info that could cause redirect confusion
      clearAuth();
      navigate("/loginpage", { replace: true });
    }
  }, [navigate]);

  return <>{children}</>;
}
