import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotesGrid from "../components/notes/NotesGrid";
import api from "../utils/axiosInterceptor";

function MyNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("newest"); // newest | oldest
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/api/user/notes/mine/");
        if (!cancelled) setNotes(res.data || []);
      } catch (err) {
        // Log for debugging and avoid unused var lint
        console.error("MyNotes load error", err);
        // Redirect only for auth errors; otherwise show error
        const status = err?.response?.status;
        if (!cancelled) {
          if (status === 401 || status === 403) {
            setError("Authentication required. Please login again.");
            navigate("/loginpage", { replace: true });
          } else if (status === 404) {
            setError(
              "Endpoint not found (404). Please update the backend URLs or restart the server."
            );
          } else {
            setError("Failed to load your notes. Please try again later.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const categories = useMemo(() => {
    const set = new Set();
    (notes || []).forEach((n) => n.category && set.add(String(n.category)));
    return ["ALL", ...Array.from(set)];
  }, [notes]);

  const filtered = useMemo(() => {
    let list = Array.isArray(notes) ? notes : [];
    // category filter
    if (category && category !== "ALL") {
      list = list.filter((n) => String(n.category) === category);
    }
    // search filter (title/body)
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.body || "").toLowerCase().includes(q)
      );
    }
    // date range (based on updated_at fallback created_at)
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      list = list.filter((n) => {
        const t = new Date(n.updated_at || n.created_at || 0).getTime();
        return t >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate).getTime();
      list = list.filter((n) => {
        const t = new Date(n.updated_at || n.created_at || 0).getTime();
        return t <= to + 24 * 60 * 60 * 1000 - 1; // inclusive end of day
      });
    }
    // sort
    list = [...list].sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at || 0).getTime();
      const bd = new Date(b.updated_at || b.created_at || 0).getTime();
      if (sort === "oldest") return ad - bd;
      // default newest
      if (bd !== ad) return bd - ad;
      return (b.id || 0) - (a.id || 0);
    });
    return list;
  }, [notes, category, query, fromDate, toDate, sort]);

  const Toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
        {/* Search */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title or content"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {/* Subject / Category */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Subject</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All" : c}
              </option>
            ))}
          </select>
        </div>
        {/* Date range */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      {/* Sort + Add */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <button
          onClick={() => navigate("/add-notes")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
        >
          <span className="text-lg">➕</span>
          <span>Add Note</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  // Empty state when user has no notes at all
  if (!notes || notes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🗒️</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          You haven’t created any notes yet
        </h2>
        <p className="text-gray-600 mb-6">
          Click the button below to add your first note.
        </p>
        <button
          onClick={() => navigate("/add-notes")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow"
        >
          <span className="text-lg">➕</span>
          <span>Add Note</span>
        </button>
      </div>
    );
  }

  // If filters remove all
  if (notes.length > 0 && filtered.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          {Toolbar}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-center">
          No notes match your filters.
          <button
            className="ml-3 underline text-yellow-900 hover:text-yellow-700"
            onClick={() => {
              setQuery("");
              setCategory("ALL");
              setFromDate("");
              setToDate("");
              setSort("newest");
            }}
          >
            Reset filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
            {filtered.length} of {notes.length}
          </span>
        </div>
        {Toolbar}
      </div>

      <NotesGrid notes={filtered} sortMode="none" />
    </div>
  );
}

export default MyNotes;
