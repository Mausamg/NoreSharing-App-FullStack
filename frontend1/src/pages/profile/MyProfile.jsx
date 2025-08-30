import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import NotesGrid from "../../components/notes/NotesGrid";
import NotesManager from "../../components/profile/NotesManager";
import SavedManager from "../../components/profile/SavedManager";
import ProfileSettings from "../../components/profile/ProfileSettings";
import ProfileAnalytics from "../../components/profile/ProfileAnalytics";
import ProfileOverview from "../../components/profile/ProfileOverview";
import axios from "axios";
import { toast } from "react-toastify";
import { authHeader, refreshAccessToken } from "../../utils/auth";

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  useEffect(() => {
    const requestWithRefresh = async (fn) => {
      try {
        return await fn();
      } catch (err) {
        if (err?.response?.status === 401) {
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            return await fn();
          }
        }
        throw err;
      }
    };

    const load = async () => {
      try {
        // 1) Self profile
        const me = await requestWithRefresh(() =>
          axios.get("http://127.0.0.1:8000/api/user/profile/", {
            headers: { ...authHeader() },
          })
        );
        setUser(me.data);

        // 2) Try dedicated endpoints first
        try {
          const [mineRes, savedRes] = await Promise.all([
            requestWithRefresh(() =>
              axios.get("http://127.0.0.1:8000/api/user/notes/mine/", {
                headers: { ...authHeader() },
              })
            ),
            requestWithRefresh(() =>
              axios.get("http://127.0.0.1:8000/api/user/notes/bookmarked/", {
                headers: { ...authHeader() },
              })
            ),
          ]);
          setNotes(mineRes.data || []);
          setSaved(savedRes.data || []);
        } catch {
          // Fallback to all notes and derive locally (handles 404 on endpoints)
          const allNotes = await requestWithRefresh(() =>
            axios.get("http://127.0.0.1:8000/api/user/notes/", {
              headers: { ...authHeader() },
            })
          );
          const list = allNotes.data || [];
          const mine = list.filter((n) => n.username === me.data.email);
          const savedOnes = list.filter((n) => n.is_bookmarked);
          setNotes(mine);
          setSaved(savedOnes);
        }
      } catch {
        // leave user null
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please login.</div>;

  const tabs = [
    { label: "Overview", to: "/profile", end: true },
    { label: "Notes", to: "/profile/notes" },
    { label: "Saved", to: "/profile/saved" },
    { label: "Analytics", to: "/profile/analytics" },
    { label: "Settings", to: "/profile/settings" },
  ];

  const lastSeg = location.pathname.split("/").pop();
  const isSaved = lastSeg === "saved";
  const isOverview = lastSeg === "profile" || lastSeg === "";
  const isNotes = lastSeg === "notes";
  const isAnalytics = lastSeg === "analytics";
  const isSettings = lastSeg === "settings";

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
        isSelf
        name={user.name}
        username={user.name}
        email={user.email}
        bio={user.bio}
        joined={new Date(
          user.created_at || user.createdAt
        ).toLocaleDateString()}
        onEditProfile={() => {
          // navigate to settings or open modal
          window.location.href = "/profile/settings";
        }}
      />
      <ProfileTabs tabs={tabs} />
      <div className="mt-6">
        {isOverview && (
          <ProfileOverview
            user={user}
            notes={notes}
            saved={saved}
            isSelf
            onView={(slug) =>
              navigate(`/note-detail/${slug}`, {
                state: { fromUserProfile: "/profile" },
              })
            }
          />
        )}
        {isNotes && (
          <NotesManager
            notes={notes}
            onView={(slug) =>
              navigate(`/note-detail/${slug}`, {
                state: { fromUserProfile: "/profile/notes" },
              })
            }
            onEdit={(slug) => navigate(`/edit-note/${slug}`)}
            onDelete={async (slug) => {
              if (!window.confirm("Delete this note? This cannot be undone."))
                return;
              try {
                await axios.delete(
                  `http://127.0.0.1:8000/api/user/notes/${encodeURIComponent(
                    slug
                  )}/`,
                  { headers: { ...authHeader() } }
                );
                setNotes((prev) => prev.filter((n) => n.slug !== slug));
              } catch {
                toast.error("Failed to delete note.");
              }
            }}
          />
        )}
        {isSaved && (
          <SavedManager
            notes={saved}
            onView={(slug) =>
              navigate(`/note-detail/${slug}`, {
                state: { fromUserProfile: "/profile/saved" },
              })
            }
            onUnsave={async (slug) => {
              try {
                await axios.delete(
                  `http://127.0.0.1:8000/api/user/notes/${encodeURIComponent(
                    slug
                  )}/bookmark/`,
                  { headers: { ...authHeader() } }
                );
                setSaved((prev) => prev.filter((n) => n.slug !== slug));
                toast.success("Removed from saved.");
              } catch {
                toast.error("Failed to unsave note.");
              }
            }}
          />
        )}
        {isAnalytics && <ProfileAnalytics notes={notes} />}
        {isSettings && (
          <ProfileSettings
            me={user}
            onSave={async (form) => {
              // 1) Update profile info (name/email/bio)
              try {
                const res = await axios.patch(
                  "http://127.0.0.1:8000/api/user/profile/",
                  { name: form.name, email: form.email, bio: form.bio },
                  { headers: { ...authHeader() } }
                );
                setUser(res.data);
                toast.success("Profile updated.");
              } catch {
                toast.error("Failed to update profile info.");
                return;
              }

              // 2) Optionally change password if provided
              if (form.password || form.password2) {
                if (form.password !== form.password2) {
                  toast.error("Passwords do not match");
                  return;
                }
                try {
                  await axios.post(
                    "http://127.0.0.1:8000/api/user/change-password/",
                    { password: form.password, password2: form.password2 },
                    { headers: { ...authHeader() } }
                  );
                  toast.success("Password changed successfully.");
                } catch {
                  toast.error("Failed to change password.");
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MyProfile;
