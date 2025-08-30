import React from "react";
import NoteCard from "../NoteCard";

// sortMode: 'newest' | 'oldest' | 'none' (default 'newest' for backwards compat)
const NotesGrid = ({ notes = [], toolbar = null, sortMode = "newest" }) => {
  let sorted = notes || [];
  if (sortMode !== "none") {
    sorted = [...sorted].sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at || 0).getTime();
      const bd = new Date(b.updated_at || b.created_at || 0).getTime();
      if (sortMode === "oldest") {
        if (ad !== bd) return ad - bd;
        return (a.id || 0) - (b.id || 0);
      }
      // default newest-first
      if (bd !== ad) return bd - ad;
      return (b.id || 0) - (a.id || 0);
    });
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 pl-23">
      {toolbar && <div className="mb-4">{toolbar}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {sorted.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </div>
  );
};

export default NotesGrid;
