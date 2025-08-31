import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../utils/axiosInterceptor";
import { toast } from "react-toastify";

export default function AdminUsers() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const fromUrl = sp.get("all");
      if (fromUrl !== null) return fromUrl === "1" || fromUrl === "true";
      const fromLS = localStorage.getItem("adminUsersShowAll");
      return fromLS === "1" || fromLS === "true";
    } catch {
      return false;
    }
  });
  const [onlineOnly, setOnlineOnly] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const fromUrl = sp.get("online");
      if (fromUrl !== null) return fromUrl === "1" || fromUrl === "true";
      const fromLS = localStorage.getItem("adminUsersOnlineOnly");
      return fromLS === "1" || fromLS === "true";
    } catch {
      return false;
    }
  });
  const meEmail =
    localStorage.getItem("currentUserEmail") ||
    sessionStorage.getItem("currentUserEmail") ||
    null;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(
        `/api/user/admin/users/${showAll ? "?all=1" : ""}`
      );
      setUsers(res.data || []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      // persist preference
      localStorage.setItem("adminUsersShowAll", showAll ? "1" : "0");
      localStorage.setItem("adminUsersOnlineOnly", onlineOnly ? "1" : "0");
      // reflect in URL without navigation
      const url = new URL(window.location.href);
      if (showAll) {
        url.searchParams.set("all", "1");
      } else {
        url.searchParams.delete("all");
      }
      if (onlineOnly) {
        url.searchParams.set("online", "1");
      } else {
        url.searchParams.delete("online");
      }
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore
    }
  }, [showAll, onlineOnly]);

  const updateUser = async (id, data) => {
    try {
      const res = await api.patch(`/api/user/admin/users/${id}/`, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const deleteUser = async (id) => {
    if (
      !window.confirm("Delete this account permanently? This cannot be undone.")
    )
      return;
    try {
      await api.delete(`/api/user/admin/users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const displayUsers = onlineOnly ? users.filter((u) => u.online) : users;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-310">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input
                type="checkbox"
                className="hover:cursor-pointer"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show all users (including never used)
            </label>
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input
                type="checkbox"
                className="hover:cursor-pointer"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
              />
              Show Online only
            </label>
            <button
              onClick={load}
              className="hover:cursor-pointer px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Presence</th>
                <th className="py-2 pr-4">Notes</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4">Last Login</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    {u.email ? (
                      <Link
                        to={`/user-profile/${encodeURIComponent(u.email)}`}
                        state={{ from: location.pathname + location.search }}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        title="View user profile"
                      >
                        {u.name || u.email}
                      </Link>
                    ) : (
                      u.name || "—"
                    )}
                  </td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.is_admin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {u.online ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Online
                      </span>
                    ) : u.last_seen ? (
                      <span
                        className="text-xs text-gray-600"
                        title={new Date(u.last_seen).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      >
                        Last seen{" "}
                        {new Date(u.last_seen).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {u.email && typeof u.notes_count === "number" ? (
                      <Link
                        to={`/user-profile/${encodeURIComponent(
                          u.email
                        )}/notes`}
                        state={{ from: location.pathname + location.search }}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        title="View user's notes"
                      >
                        {u.notes_count}
                      </Link>
                    ) : typeof u.notes_count === "number" ? (
                      u.notes_count
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {u.last_login
                      ? new Date(u.last_login).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2 pr-4 flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateUser(u.id, { is_admin: !u.is_admin })
                      }
                      disabled={u.email === meEmail}
                      className={`px-2 py-1 rounded text-white w-28 text-center whitespace-nowrap ${
                        u.email === meEmail
                          ? "bg-indigo-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {u.is_admin ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() =>
                        updateUser(u.id, { is_active: !u.is_active })
                      }
                      disabled={u.email === meEmail}
                      className={`px-2 py-1 rounded text-white w-28 text-center whitespace-nowrap ${
                        u.email === meEmail
                          ? "bg-amber-300 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={u.email === meEmail}
                      className={`px-2 py-1 rounded text-white w-28 text-center whitespace-nowrap ${
                        u.email === meEmail
                          ? "bg-red-300 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
