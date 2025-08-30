import React from "react";

const NotesManager = ({ notes = [], onEdit, onDelete, onView }) => {
  if (!notes.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-600">
        You haven't created any notes yet.
      </div>
    );
  }

  const sorted = [...(notes || [])].sort((a, b) => {
    const ad = new Date(a.updated_at || a.created_at || 0).getTime();
    const bd = new Date(b.updated_at || b.created_at || 0).getTime();
    if (bd !== ad) return bd - ad;
    return (b.id || 0) - (a.id || 0);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="divide-y divide-gray-100">
        {sorted.map((n) => (
          <div key={n.id} className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {n.title}
                </h3>
                {n.category && (
                  <span className="px-2 py-0.5 rounded-full border text-xs text-gray-700 bg-gray-50 capitalize">
                    {String(n.category).toLowerCase()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Updated{" "}
                {new Date(n.updated_at || n.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                onClick={() => onView?.(n.slug)}
              >
                View
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-lg border text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => onEdit?.(n.slug)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-lg border text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDelete?.(n.slug)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesManager;
