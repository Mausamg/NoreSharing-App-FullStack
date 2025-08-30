import React from "react";

// Lightweight shimmer skeleton for a single note card
const NoteSkeletonCard = () => {
  return (
    <div className="w-full md:w-4/12 px-3 mb-4">
      <div className="bg-white rounded-lg shadow-sm p-4 relative flex flex-col border border-gray-100 w-100 max-h-55 min-h-55 overflow-hidden">
        {/* shimmer overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="shimmer h-full w-full" />
        </div>

        {/* Header: avatar, name/date, category pill */}
        <div className="flex items-center gap-3 mb-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="flex-1 min-w-0">
            <div className="h-3.5 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>

        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-4/5 mb-3 animate-pulse" />

        {/* Body lines */}
        <div className="space-y-2 mb-4">
          <div className="h-3.5 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-3.5 bg-gray-200 rounded w-11/12 animate-pulse" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-6 bg-gray-200 rounded ml-1 animate-pulse" />
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default NoteSkeletonCard;
