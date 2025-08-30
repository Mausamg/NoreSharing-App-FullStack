import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
// SuccessBanner removed to avoid duplicate success messages; toasts handle feedback now
import NoteCardContainer from "../components/NoteContainer";
import NoteSkeletonGrid from "../components/NoteSkeletonGrid";
import { NotesContext } from "../context/NotesContext";

function HomePage({ filterCategory = "" }) {
  const { notes, loading } = useContext(NotesContext);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";

  const filteredNotes = (() => {
    const base = filterCategory
      ? (notes || []).filter((n) => n.category === filterCategory)
      : notes || [];
    if (!q) {
      return [...base].sort((a, b) => {
        const ad = new Date(a.updated_at || a.created_at || 0).getTime();
        const bd = new Date(b.updated_at || b.created_at || 0).getTime();
        if (bd !== ad) return bd - ad;
        return (b.id || 0) - (a.id || 0);
      });
    }
    const qq = q.toLowerCase();
    const res = base.filter((n) => {
      return (
        (n.title || "").toLowerCase().includes(qq) ||
        (n.category || "").toLowerCase().includes(qq) ||
        (n.name || n.username || "").toLowerCase().includes(qq)
      );
    });
    // newest first by updated_at then created_at then id
    return [...res].sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at || 0).getTime();
      const bd = new Date(b.updated_at || b.created_at || 0).getTime();
      if (bd !== ad) return bd - ad;
      return (b.id || 0) - (a.id || 0);
    });
  })();

  // mounted toggles to allow entrance animation when filter changes
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    // briefly unmount then mount to restart entrance animation
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, [filterCategory, q]);

  const titleForCategory = (cat) => {
    if (!cat) return "ALL NOTES";
    const map = { SCHOOL: "School", PERSONAL: "Personal", WORK: "Work" };
    return `${map[cat] || cat} Notes`;
  };

  return (
    <div className="relative">
      <div className="mb-4 ml-24 mt-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-black mb-2">
              {titleForCategory(filterCategory)}
            </h1>
            {/* Left-side: only show the active filter indicator here */}
            {q && (
              <span className="ml-2 text-md text-gray-500">
                • Searched: "{q}"
              </span>
            )}
          </div>

          <p className="text-gray-900 dark:text-gray-600 text-[18px]">
            Discover and share knowledge with the community
          </p>
        </div>
        {/* Right-side: counts badge */}
        <div className="mr-24">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
            {(() => {
              const total = Array.isArray(notes) ? notes.length : 0;
              const filtered = Array.isArray(filteredNotes)
                ? filteredNotes.length
                : 0;
              if (filterCategory)
                return `Showing ${filtered} of ${total} Notes`;
              return q ? `Showing ${filtered} results` : `Total ${total} Notes`;
            })()}
          </span>
        </div>
      </div>

      {loading ? (
        <NoteSkeletonGrid count={9} />
      ) : filteredNotes && filteredNotes.length > 0 ? (
        <NoteCardContainer notes={filteredNotes} mounted={mounted} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-340 min-h-[200px] p-8 mb-4 ml-20 text-center text-gray-500">
          No notes found.
        </div>
      )}
    </div>
  );
}

export default HomePage;
