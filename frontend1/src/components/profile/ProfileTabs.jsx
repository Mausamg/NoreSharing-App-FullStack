import React from "react";
import { NavLink } from "react-router-dom";

const ProfileTabs = ({ tabs = [] }) => {
  return (
    <div className="mt-6 border-b border-gray-200">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `whitespace-nowrap pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`
            }
            end={t.end}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default ProfileTabs;
