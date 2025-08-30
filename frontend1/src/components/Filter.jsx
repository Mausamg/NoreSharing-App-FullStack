import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Filter = ({ onFilterChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Derive current category from the URL path if present (/filter/:category)
  const categoryFromPath = (() => {
    const m = location.pathname.match(/^\/filter\/([^/]+)/);
    return m ? m[1] : "";
  })();

  const [selected, setSelected] = useState(categoryFromPath);

  // displayedLabel + isFading implement a fade-out / swap / fade-in for the visible
  // label so changes feel smooth rather than instant. Initialize immediately
  // from the derived selected value to avoid a blank render before effects run.
  const labelFor = (val) => {
    if (!val) return "All Notes";
    const map = { SCHOOL: "School", PERSONAL: "Personal", WORK: "Work" };
    return map[val] || val;
  };

  const [displayedLabel, setDisplayedLabel] = useState(labelFor(selected));
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Keep select in sync when the URL changes (e.g., refresh, back/forward)
    setSelected(categoryFromPath);
    if (onFilterChange) onFilterChange(categoryFromPath || "");
  }, [categoryFromPath, onFilterChange]);

  // (no mount init needed — state is already initialized)

  // Animate label when `selected` changes (either by user or URL)
  useEffect(() => {
    // If displayedLabel is already correct, nothing to do
    const next = labelFor(selected);
    if (next === displayedLabel) return;
    setIsFading(true);
    const t = setTimeout(() => {
      setDisplayedLabel(next);
      setIsFading(false);
    }, 180); // match CSS transition-duration
    return () => clearTimeout(t);
  }, [selected, displayedLabel]);

  const handleChange = (e) => {
    const val = e.target.value;
    setSelected(val);
    // Inform parent state if provided
    if (onFilterChange) onFilterChange(val);
    // Navigate to a dedicated route so filter state is shareable / bookmarkable
    if (val) navigate(`/filter/${val}`);
    else navigate(`/`);
  };

  return (
    <div className="w-full max-w-md mx-auto my-5 h-12 relative">
      <label
        htmlFor="note-filter"
        className="block mb-2 text-gray-700 dark:text-gray-200 font-medium"
      ></label>
      <div className="relative group">
        <select
          id="note-filter"
          value={selected}
          onChange={handleChange}
          aria-label="Filter notes by category"
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md bg-white/20 group-hover:bg-white/30 focus:bg-white/40 text-transparent hover:text-transparent focus:text-transparent appearance-none focus:outline-none transition duration-00 ease-in-out focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        >
          <option value="" style={{ color: "#111827" }}>
            All Notes
          </option>
          <option value="SCHOOL" style={{ color: "#111827" }}>
            School
          </option>
          <option value="PERSONAL" style={{ color: "#111827" }}>
            Personal
          </option>
          <option value="WORK" style={{ color: "#111827" }}>
            Work
          </option>
        </select>

        {/* Overlay label: pointer-events-none so clicks go to the underlying select. */}
        <div
          className={`absolute inset-0 flex items-center justify-between pl-4 pr-3 pointer-events-none z-10 transition duration-220 ease-in-out ${
            isFading
              ? "opacity-0 -translate-y-1 scale-95 blur-[0.5px]"
              : "opacity-100 translate-y-0 scale-100 blur-0"
          } group-hover:opacity-100 group-focus-within:opacity-100`}
          aria-hidden="true"
          style={{ willChange: "opacity, transform, filter" }}
        >
          <span className="text-gray-800 truncate transition-colors duration-200 group-hover:text-gray-900 group-focus-within:text-gray-900">
            {displayedLabel}
          </span>
          {/* caret icon shown in overlay (pointer-events-none) so clicks pass through to select */}
          <svg
            className="w-4 h-4 text-gray-600 ml-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Filter;
