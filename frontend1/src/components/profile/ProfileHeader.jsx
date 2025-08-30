import React from "react";

const ProfileHeader = ({
  isSelf = false,
  name = "User",
  username = "",
  email = "",
  bio = "",
  joined = "",
  onEditProfile,
}) => {
  const initial = (name || username || "?").charAt(0).toUpperCase();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 relative group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none text-white text-2xl font-bold">
            {initial}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {name || username}
            </h1>
            {username && <span className="text-gray-500">@{username}</span>}
          </div>
          {email && isSelf && (
            <div className="text-sm text-gray-500">{email}</div>
          )}
          {bio && (
            <p className="mt-2 text-gray-700 whitespace-pre-line">{bio}</p>
          )}
          {joined && (
            <div className="mt-2 text-sm text-gray-500">Joined {joined}</div>
          )}
        </div>
        {isSelf && (
          <button
            type="button"
            onClick={onEditProfile}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
