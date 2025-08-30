import React, { useState, useRef, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import SearchResult from "./SearchResult";
import { NotesContext } from "../context/NotesContext";

function SearchBar({ className = "" }) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const { notes: allNotes } = useContext(NotesContext);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Fetch search results from Django API
  const fetchResults = async (query, field = "all") => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Use a relative URL so the frontend can work with a dev proxy or same-origin server.
      const url = `/api/search_notes/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Server returned 404/500 HTML page — fallback to local filtering
        console.warn(`Search API returned HTTP ${response.status}`);
        fallbackLocalSearch(query, field);
        return;
      }

      // Try to parse JSON but be defensive if the server returns HTML (e.g. a 404 page)
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn(
          "Search API returned non-JSON response, falling back to local search",
          parseErr
        );
        fallbackLocalSearch(query, field);
        return;
      }

      if (data && Array.isArray(data)) {
        setResults(data);
      } else if (data && data.error) {
        console.error("API Error:", data.error);
        // fallback to client-side search
        fallbackLocalSearch(query, field);
      } else {
        // unknown response shape -> fallback
        fallbackLocalSearch(query, field);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      // On network or other error, fallback to local filtering if possible
      fallbackLocalSearch(query, field);
    } finally {
      setLoading(false);
    }
  };

  const fallbackLocalSearch = (query, field) => {
    if (!allNotes || !Array.isArray(allNotes)) return setResults([]);
    const q = query.toLowerCase();
    const filtered = allNotes.filter((n) => {
      if (field === "title") return (n.title || "").toLowerCase().includes(q);
      if (field === "category")
        return (n.category || "").toLowerCase().includes(q);
      if (field === "user")
        return (n.name || n.username || "").toLowerCase().includes(q);
      // all
      return (
        (n.title || "").toLowerCase().includes(q) ||
        (n.category || "").toLowerCase().includes(q) ||
        (n.name || n.username || "").toLowerCase().includes(q)
      );
    });
    setResults(filtered);
  };

  // Handle input change
  const handleChange = (value) => {
    setInputValue(value);
    // debounce the requests
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 300);
    setShowResults(true);
  };

  // Hide results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide results on route change
  useEffect(() => {
    setShowResults(false);
  }, [location]);

  // Keep input in sync with URL `?q=` so reloads reflect the active filter in the header
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setInputValue(q);
  }, [location.search]);

  // Listen for reset events (e.g. clicking brand logo) to clear search
  useEffect(() => {
    const handler = () => {
      setInputValue("");
      setResults([]);
      setShowResults(false);
    };
    window.addEventListener("search:reset", handler);
    return () => window.removeEventListener("search:reset", handler);
  }, []);

  return (
    <div ref={searchRef} className={`relative w-full min-w-0 ${className}`}>
      <div
        className={`
          flex items-center border-gray-800 bg-white rounded shadow-md w-full px-3 py-1 h-12 transition-all duration-200
          max-w-full
          sm:max-w-[320px]
          md:max-w-[420px]
          lg:max-w-[520px]
        `}
      >
        <IoSearch className="text-gray-600 text-10 mr-2" />
        <input
          type="text"
          placeholder="Search notes by title, category, or user..."
          className="w-full outline-none border-none bg-transparent placeholder:text-md placeholder:text-gray-400 min-w-0"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowResults(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const qparam = `?q=${encodeURIComponent(inputValue || "")}`;
              // If we're currently on a /filter/:category path, preserve it and append the query
              if (location.pathname.startsWith("/filter/")) {
                navigate(`${location.pathname}${qparam}`);
              } else {
                navigate(`/${qparam}`);
              }
              setShowResults(false);
            }
          }}
        />
      </div>

      {showResults && inputValue && (
        <div className="absolute top-full left-0 mt-1 w-full z-50">
          {loading ? (
            <div className="bg-white shadow-md rounded p-2 text-gray-500">
              Loading...
            </div>
          ) : results.length > 0 ? (
            <SearchResult results={results} />
          ) : (
            <div className="bg-white shadow-md rounded p-2 text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
