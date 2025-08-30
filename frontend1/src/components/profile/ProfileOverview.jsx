import React from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

const ProfileOverview = ({
  user,
  notes = [],
  saved = [],
  isSelf = false,
  onView,
  profileUsername,
}) => {
  const noteCount = notes.length;
  const savedCount = saved.length;
  const recent = (notes || []).slice(0, 3);

  // Compute weighted average rating across all notes
  const ratings = (notes || []).map((n) => ({
    avg: Number(n?.avg_rating) || 0,
    cnt: Number(n?.ratings_count) || 0,
  }));
  const totalCnt = ratings.reduce((a, r) => a + r.cnt, 0);
  let avgAll = 0;
  if (totalCnt > 0) {
    avgAll = ratings.reduce((s, r) => s + r.avg * r.cnt, 0) / totalCnt;
  } else if (ratings.length > 0) {
    avgAll = ratings.reduce((s, r) => s + r.avg, 0) / ratings.length;
  }
  const avgAllStr = Number.isFinite(avgAll) ? avgAll.toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div
        className={`grid grid-cols-1 ${
          isSelf ? "sm:grid-cols-4" : "sm:grid-cols-3"
        } gap-4`}
      >
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm pl-20 pt-6">
          <div className="text-sm text-gray-500">Notes</div>
          <div className="text-2xl font-semibold text-gray-900">
            {noteCount}
          </div>
        </div>
        {isSelf && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm pl-25 pt-6">
            <div className="text-sm text-gray-500">Saved</div>
            <div className="text-2xl font-semibold text-gray-900">
              {savedCount}
            </div>
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm pl-20">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <FaStar className="text-yellow-400" />
            Avg Rating
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {avgAllStr}
            <span className="text-sm text-gray-400 ml-1">/ 5</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Based on {totalCnt} rating{totalCnt === 1 ? "" : "s"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm pt-6 pl-20">
          <div className="text-sm text-gray-500">Member since</div>
          <div className="text-xl font-semibold text-gray-900">
            {new Date(
              user?.created_at || user?.createdAt || Date.now()
            ).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Bio */}
      {user?.bio && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-900 mb-1">About</div>
          <p className="text-gray-700 whitespace-pre-line">{user.bio}</p>
        </div>
      )}

      {/* Recent notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-900">Recent Notes</div>
          <Link
            to={
              isSelf
                ? "/profile/notes"
                : `/user-profile/${encodeURIComponent(
                    profileUsername || user?.username || user?.name || ""
                  )}/notes`
            }
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            View all
          </Link>
        </div>
        {recent.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recent.map((n) => (
              <li
                key={n.slug}
                className="py-2 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div
                    className="text-sm text-gray-900 truncate"
                    title={n.title}
                  >
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(
                      n.updated_at || n.created_at
                    ).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="ml-3 text-xs text-indigo-600 hover:text-indigo-800 hover:cursor-pointer"
                  onClick={() => onView && onView(n.slug)}
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">
            {isSelf ? (
              <>
                No notes yet.{" "}
                <Link
                  to="/add-notes"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Create your first note
                </Link>
                .
              </>
            ) : (
              "No notes to show."
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOverview;
