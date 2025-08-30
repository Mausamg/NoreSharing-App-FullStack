import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoSearch } from "react-icons/io5";
import SearchBar from "../search/SearchBar";
import { FiUpload } from "react-icons/fi";
import { GoPerson } from "react-icons/go";
import Filter from "./Filter";

function Navbar({ onFilterChange, currentUser, currentUserName, isAuthed }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchBarOpen, setSearchBarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const inputRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLoggedIn =
    typeof isAuthed === "boolean" ? isAuthed : Boolean(currentUser);
  const location = useLocation();

  useEffect(() => {
    if (isSearchBarOpen && inputRef.current) inputRef.current.focus();
  }, [isSearchBarOpen]);

  // Ensure profile dropdown is closed when auth changes (e.g., right after login/logout)
  useEffect(() => {
    setIsProfileOpen(false);
  }, [currentUser]);

  useEffect(() => {
    const handler = (e) => {
      setIsModalOpen(Boolean(e?.detail?.open));
    };
    window.addEventListener("modal:toggle", handler);
    return () => window.removeEventListener("modal:toggle", handler);
  }, []);

  const email = currentUser || "";
  const fallbackName = email ? email.split("@")[0] : "";
  const displayName = currentUserName || fallbackName;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  const isAdmin =
    localStorage.getItem("is_admin") === "true" ||
    sessionStorage.getItem("is_admin") === "true";

  const navItems = [
    {
      to: "/my-notes",
      label: (
        <>
          <GoPerson className="inline-block mr-1" />
          My Notes
        </>
      ),
    },
    {
      to: "/add-notes",
      label: (
        <>
          <FiUpload className="inline-block mr-1" />
          Upload Note
        </>
      ),
    },
    ...(isAdmin
      ? [
          {
            to: "/admin/users",
            label: (
              <>
                <GoPerson className="inline-block mr-1" />
                All Users
              </>
            ),
          },
        ]
      : []),
  ];

  const handleLogout = () => {
    [
      "accessToken",
      "refreshToken",
      "currentUser",
      "currentUserEmail",
      "currentUserName",
      "token",
    ].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    // Remove admin flag
    localStorage.removeItem("is_admin");
    sessionStorage.removeItem("is_admin");
    // Notify app and let routing handle the rest
    window.dispatchEvent(new Event("auth:change"));
    // Optionally soft-navigate home if you're on a protected page
    try {
      if (window.location.pathname.startsWith("/profile")) {
        window.history.pushState({}, "", "/");
      }
    } catch {
      // ignore navigation errors
    }
  };

  return (
    <nav
      className={`w-full border-b border-gray-200 sticky top-0 z-50 shadow-sm hover:shadow-md transition-shadow duration-300 h-20 bg-white bg-opacity-95`}
      style={{
        backgroundColor: isModalOpen ? "rgba(255,255,255,0.82)" : undefined,
      }}
    >
      <div className=" sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-full">
        {/* Brand */}
        <a
          href={
            location.pathname.startsWith("/filter/") ? location.pathname : "/"
          }
          className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200"
        >
          Noteshare
        </a>

        {/* Desktop nav + search + filter */}
        <div className="hidden md:flex items-center flex-1 ml-10 min-w-0 gap-0">
          {/* Search bar */}
          <div className="flex-1 max-w-xl mr-2">
            <SearchBar className="w-full" />
          </div>

          {/* Filter dropdown (not a navigation link) */}
          <div className="mr-2">
            <div className="min-w-[120px] max-w-[140px]">
              <Filter onFilterChange={onFilterChange} />
            </div>
          </div>

          {/* Nav items */}
          <ul className="flex items-center gap-4 flex-shrink-0 min-w-0">
            {navItems.map((item) => (
              <li key={item.to} className="flex-shrink-0 flex items-center">
                {item.to === "/admin/users" ? (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `relative px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ring-1 ${
                        isActive
                          ? "bg-purple-600 text-white ring-purple-600 shadow-md scale-[1.02]"
                          : "bg-purple-50 text-purple-700 ring-purple-200 hover:bg-purple-100 hover:ring-purple-300"
                      }`
                    }
                    title="Admin: All Users"
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.label}
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                        Admin
                      </span>
                    </span>
                  </NavLink>
                ) : (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-amber-100 text-amber-800"
                          : "text-gray-600 hover:bg-gray-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}

            {/* Profile / Login */}
            <li className="relative">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                      {initial}
                    </div>
                    <span
                      className="text-sm font-semibold text-gray-800 max-w-[140px] truncate"
                      title={displayName}
                    >
                      {displayName}
                    </span>
                    <svg
                      className={`w-4 h-4 ml-1 transition-transform ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-3 px-3 animate-fade-in-up">
                      <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-100 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base shadow">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-bold text-base text-gray-800 truncate"
                            title={displayName}
                          >
                            {displayName}
                          </div>
                          {email && (
                            <div
                              className="text-xs text-gray-500 truncate"
                              title={email}
                            >
                              {email}
                            </div>
                          )}
                        </div>
                      </div>
                      <NavLink
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 rounded transition"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Profile
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded transition mt-1"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/loginpage"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Login
                </NavLink>
              )}
            </li>
          </ul>
        </div>

        {/* Mobile view */}
        <div className="md:hidden flex items-center gap-4 ml-auto">
          <button
            onClick={() => setSearchBarOpen(!isSearchBarOpen)}
            className="p-2 text-gray-600 hover:text-amber-700 transition-colors"
          >
            <IoSearch className="text-xl" />
          </button>
          {isSearchBarOpen && (
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              className="absolute top-20 left-4 right-4 w-[calc(100%-2rem)] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm bg-gray-50 dark:bg-gray-800"
            />
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-amber-700 transition-colors"
          >
            <GiHamburgerMenu className="text-xl" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden px-4 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
        } bg-white/95 backdrop-blur-sm`}
      >
        {/* Optional mobile filter */}
        <div className="my-2">
          <Filter onFilterChange={onFilterChange} />
        </div>

        {navItems.map((item) =>
          item.to === "/admin/users" ? (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block w-full px-4 py-3 rounded-lg text-sm font-semibold mb-2 last:mb-0 transition-all ring-1 ${
                  isActive
                    ? "bg-purple-600 text-white ring-purple-600 shadow"
                    : "text-purple-700 bg-purple-50 ring-purple-200 hover:bg-purple-100 hover:ring-purple-300"
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
              title="Admin: All Users"
            >
              <span className="inline-flex items-center gap-2">
                {item.label}
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                  Admin
                </span>
              </span>
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block w-full px-4 py-3 rounded-lg text-sm font-medium mb-2 last:mb-0 transition-colors ${
                  isActive
                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          )
        )}

        {isLoggedIn ? (
          <div className="border-t pt-2">
            <NavLink
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        ) : (
          <NavLink
            to="/loginpage"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Login
          </NavLink>
        )}

        <Outlet />
      </div>
    </nav>
  );
}

export default Navbar;
