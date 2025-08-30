import Navbar from "./components/Navbar";
import AppRouter from "./routes/AppRouter";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotesProvider } from "./context/NotesProvider";
import { getAccessToken } from "./utils/auth";
import { useEffect, useState } from "react";
import api from "./utils/axiosInterceptor";

function App() {
  const [filterCategory, setFilterCategory] = useState("");

  // Centralize reading auth info from storage
  const readAuth = () => {
    const currentUser =
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("currentUser") ||
      null;
    const email =
      localStorage.getItem("currentUserEmail") ||
      sessionStorage.getItem("currentUserEmail") ||
      currentUser;
    const name =
      localStorage.getItem("currentUserName") ||
      sessionStorage.getItem("currentUserName") ||
      (email ? email.split("@")[0] : null);
    return { email, name };
  };

  const [{ email: currentUserEmail, name: currentUserName }, setAuth] =
    useState(() => readAuth());
  const [isAuthed, setIsAuthed] = useState(() => Boolean(getAccessToken()));

  // Listen for auth changes (custom event + storage from other tabs)
  useEffect(() => {
    const update = () => {
      setAuth(readAuth());
      setIsAuthed(Boolean(getAccessToken()));
    };
    const onStorage = (e) => {
      if (!e || !e.key) {
        update();
        return;
      }
      if (
        [
          "currentUser",
          "currentUserEmail",
          "currentUserName",
          "accessToken",
          "refreshToken",
        ].includes(e.key)
      ) {
        update();
      }
    };
    window.addEventListener("auth:change", update);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth:change", update);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Heartbeat: ping server every 60s while authenticated
  useEffect(() => {
    let t;
    const ping = async () => {
      try {
        await api.post("/api/user/heartbeat/");
      } catch {
        // ignore transient errors
      }
    };
    if (isAuthed) {
      // immediate then interval
      ping();
      t = setInterval(ping, 60000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isAuthed]);

  // Flash message support: show a toast stored in sessionStorage across reloads
  useEffect(() => {
    const flash = sessionStorage.getItem("flashMessage");
    if (flash) {
      toast.success(flash);
      sessionStorage.removeItem("flashMessage");
    }
  }, []);

  return (
    <NotesProvider>
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* Navbar */}
        <Navbar
          currentUser={currentUserEmail}
          currentUserName={currentUserName}
          isAuthed={isAuthed}
          onFilterChange={(val) => setFilterCategory(val)}
        />

        {/* Toast Notification (positioned below navbar) */}
        <ToastContainer
          position="top-center"
          style={{ top: "88px" }}
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          toastClassName={() =>
            "relative flex p-4 rounded-xl shadow-lg bg-white text-gray-800"
          }
          bodyClassName={() => "text-sm font-medium"}
        />

        {/* Main Content */}
        <main className="flex-grow w-full">
          <AppRouter
            currentUser={currentUserEmail}
            filterCategory={filterCategory}
          />
        </main>

        {/* Footer */}
        <footer className="w-full bg-gray-800 text-white text-center py-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} MausamG. All rights reserved.
          </p>
        </footer>
      </div>
    </NotesProvider>
  );
}

export default App;
