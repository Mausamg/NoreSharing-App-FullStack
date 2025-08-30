import React from "react";
import NoteSkeletonCard from "./NoteSkeletonCard";

// Renders a grid of skeleton note cards
const NoteSkeletonGrid = ({ count = 6 }) => {
  const items = Array.from({ length: count });
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-340 min-h-screen p-4 mb-4 ml-20 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {items.map((_, i) => (
          <NoteSkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
};

export default NoteSkeletonGrid;
