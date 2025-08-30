import React from "react";
import NoteSkeletonGrid from "../NoteSkeletonGrid";

// mode: 'overview' | 'notes'
const ProfileSkeleton = ({ mode = "overview" }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back button placeholder */}
      <div className="mb-4">
        <div className="inline-block h-9 w-28 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-5 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3.5 w-4/5 bg-gray-200 rounded animate-pulse" />
          <div className="h-3.5 w-3/5 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>

      <div className="mt-6">
        {mode === "notes" ? (
          <NoteSkeletonGrid count={6} />
        ) : (
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-3 animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
            {/* Recent notes list */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="h-4 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSkeleton;
