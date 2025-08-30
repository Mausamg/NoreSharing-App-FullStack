import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import NotesGrid from "../../components/notes/NotesGrid";
import ProfileOverview from "../../components/profile/ProfileOverview";
import axios from "axios";

const PublicProfile = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleBack = () => {
    const from = location.state && location.state.from;
    if (from) {
      navigate(from);
      return;
    }
    try {
      const sameOriginReferrer =
        document.referrer &&
        new URL(document.referrer).origin === window.location.origin;
      if (sameOriginReferrer && window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch {
      // ignore URL parsing errors
    }
    const isAdmin =
      localStorage.getItem("is_admin") === "true" ||
      localStorage.getItem("is_admin") === "1";
    navigate(isAdmin ? "/admin/users" : "/");
  };

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Public endpoints; adjust to your backend paths
        const [profileRes, notesRes] = await Promise.all([
          axios.get(
            `http://127.0.0.1:8000/api/user/profile/${encodeURIComponent(
              username
            )}/`
          ),
          axios.get(
            `http://127.0.0.1:8000/api/user/notes/by-user/${encodeURIComponent(
              username
            )}/`
          ),
        ]);
        setUser(profileRes.data);
        setNotes(notesRes.data || []);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!user) return <div className="p-6">User not found.</div>;

  const tabs = [
    {
      label: "Overview",
      to: `/user-profile/${encodeURIComponent(username)}`,
      end: true,
    },
    {
      label: "Notes",
      to: `/user-profile/${encodeURIComponent(username)}/notes`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2 rounded-lg transition hover:bg-indigo-50"
          title="Go back"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <ProfileHeader
        isSelf={false}
        name={user.name || user.username}
        username={user.username || user.name}
        bio={user.bio}
        joined={new Date(
          user.created_at || user.createdAt || Date.now()
        ).toLocaleDateString()}
      />
      <ProfileTabs tabs={tabs} />
      <div className="mt-6">
        {(() => {
          const base = `/user-profile/${encodeURIComponent(username)}`;
          if (location.pathname === base) {
            return (
              <ProfileOverview
                user={user}
                notes={notes}
                saved={[]}
                isSelf={false}
                profileUsername={username}
                onView={(slug) =>
                  navigate(`/note-detail/${slug}`, {
                    state: { fromUserProfile: base },
                  })
                }
              />
            );
          }
          if (location.pathname === `${base}/notes`) {
            return <NotesGrid notes={notes} />;
          }
          return <NotesGrid notes={notes} />;
        })()}
      </div>
    </div>
  );
};

export default PublicProfile;
