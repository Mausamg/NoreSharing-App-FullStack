import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const SuccessBanner = ({ message, duration = 2000 }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!message) return;
    setMounted(true);
    // next tick to allow transition
    const enterId = setTimeout(() => setVisible(true), 0);

    // hide after duration
    const hideId = setTimeout(() => setVisible(false), duration);

    // unmount after hide transition (match previous 500ms)
    const unmountId = setTimeout(() => {
      setMounted(false);
      // clear navigation state so reloads don't re-show it
      try {
        navigate(location.pathname, { replace: true, state: {} });
      } catch {
        // ignore
      }
    }, duration + 500);

    return () => {
      clearTimeout(enterId);
      clearTimeout(hideId);
      clearTimeout(unmountId);
    };
  }, [message, duration, navigate, location.pathname]);

  if (!mounted || !message) return null;

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-4 scale-95"
      }`}
      role="status"
      aria-live="polite"
    >
      <CheckCircle className="w-6 h-6 text-green-600 mr-2 transition-transform duration-500" />
      <p className="font-medium text-lg">{message}</p>
    </div>
  );
};

export default SuccessBanner;
