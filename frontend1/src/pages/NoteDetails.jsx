import { useEffect, useState, useRef } from "react";
import { BiSolidTrashAlt } from "react-icons/bi";
import { FiEdit } from "react-icons/fi";
import {
  FaArrowLeft,
  FaDownload,
  FaUserCircle,
  FaEye,
  FaStar,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "../components/Modal";
import { toast } from "react-toastify";
import { authHeader, getAccessToken } from "../utils/auth";
import { useContext } from "react";
import { NotesContext } from "../context/NotesContext";
import { VscFileSubmodule } from "react-icons/vsc";

const NoteDetailPage = ({ currentUser }) => {
  const [note, setNote] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [error, setError] = useState(null);
  const { slug } = useParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshNotes, updateNoteInList } = useContext(NotesContext);
  const navigate = useNavigate();
  const location = useLocation();
  const shownSuccessRef = useRef(false);
  const handleBack = () => {
    const from = location?.state?.fromUserProfile;
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
      // ignore parsing errors
    }
    navigate("/");
  };

  // Inline ephemeral feedback (non-popup) for rating/bookmark only
  const [feedback, setFeedback] = useState(null); // { text, variant: 'bookmark'|'rating'|'error' }
  const [fbVisible, setFbVisible] = useState(false);
  const fbTimerRef = useRef(null);

  const showFeedback = (text, variant = "bookmark") => {
    if (fbTimerRef.current) {
      clearTimeout(fbTimerRef.current.hide);
      clearTimeout(fbTimerRef.current.clear);
    }
    setFeedback({ text, variant });
    setFbVisible(true);
    const hide = setTimeout(() => setFbVisible(false), 800);
    const clear = setTimeout(() => setFeedback(null), 1000);
    fbTimerRef.current = { hide, clear };
  };

  const handleIsOpen = () => setIsOpen(!isOpen);

  const refreshAccessToken = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");
    if (!refreshToken) return null;
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
        refresh: refreshToken,
      });
      const newAccess = res.data?.access;
      if (newAccess) {
        if (localStorage.getItem("refreshToken")) {
          localStorage.setItem("accessToken", newAccess);
        } else {
          sessionStorage.setItem("accessToken", newAccess);
        }
      }
      return newAccess || null;
    } catch (e) {
      console.error("Failed to refresh token:", e);
      return null;
    }
  };

  const performDelete = async (slugToDelete) => {
    if (!getAccessToken()) {
      toast.error("You must be logged in to delete a note.");
      return;
    }
    let headers = { ...authHeader() };
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/user/notes/${slugToDelete}/`,
        { headers }
      );
      // refresh notes list if provider exposes refreshNotes
      try {
        if (refreshNotes) refreshNotes();
      } catch {
        // ignore
      }
      // show a toast and navigate home
      toast.success("Note deleted successfully!", { position: "top-center" });
      navigate("/");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          headers = { Authorization: `Bearer ${newAccess}` };
          await axios.delete(
            `http://127.0.0.1:8000/api/user/notes/${slugToDelete}/`,
            { headers }
          );
          try {
            if (refreshNotes) refreshNotes();
          } catch {
            // ignore
          }
          toast.success("Note deleted successfully!", {
            position: "top-center",
          });
          navigate("/");
          return;
        }
      }
      console.error("Failed to delete note:", err);
      toast.error("Failed to delete note", { position: "top-center" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    // show toast if navigation provided a success message (e.g., after edit)
    const msg = location?.state?.successMessage;
    if (msg && !shownSuccessRef.current) {
      shownSuccessRef.current = true;
      toast.success(msg, { position: "top-center" });
      // clear the navigation state so the message doesn't reappear (no router navigation)
      try {
        // replace history state with same path but empty state
        window.history.replaceState({}, "", location.pathname);
      } catch {
        // ignore
      }
    }

    setIsLoading(true);
    const load = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/user/notes/${slug}/`,
          { headers: { ...authHeader() } }
        );
        setNote(res.data);
        setIsBookmarked(!!res.data?.is_bookmarked);
        setUserRating(res.data?.user_rating ?? null);
      } catch (err) {
        if (err?.response?.status === 401) {
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            const res2 = await axios.get(
              `http://127.0.0.1:8000/api/user/notes/${slug}/`,
              { headers: { ...authHeader() } }
            );
            setNote(res2.data);
            setIsBookmarked(!!res2.data?.is_bookmarked);
            setUserRating(res2.data?.user_rating ?? null);
          } else {
            // fallback unauthenticated
            const resPub = await axios.get(
              `http://127.0.0.1:8000/api/user/notes/${slug}/`
            );
            setNote(resPub.data);
            setIsBookmarked(false);
            setUserRating(null);
          }
        } else {
          setError("Failed to load note");
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug, location.pathname, location.state?.successMessage, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">Note not found</div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`max-w-4xl mx-auto bg-white bg-opacity-95 rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden transition-all duration-200 relative z-0 ${
          isOpen ? "opacity-70 pointer-events-none" : "opacity-90"
        }`}
        style={isOpen ? { filter: "blur(2px)" } : undefined}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between relative">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2 rounded-lg transition hover:bg-indigo-50"
            title="Go back"
          >
            <FaArrowLeft className="w-4 h-4" />
            {location?.state?.fromUserProfile ? "Back to Profile" : "Back"}
          </button>
          {feedback && (
            <div
              className={`absolute right-3 top-3 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-sm ring-1 transition-all duration-200 ${
                fbVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-1"
              } ${
                feedback.variant === "bookmark"
                  ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                  : feedback.variant === "rating"
                  ? "bg-amber-100 text-amber-700 ring-amber-200"
                  : "bg-red-100 text-red-700 ring-red-200"
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-1">
                {feedback.variant === "bookmark" && (
                  <FaBookmark className="text-indigo-600" />
                )}
                {feedback.variant === "rating" && (
                  <FaStar className="text-amber-400" />
                )}
                {feedback.text}
              </span>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="px-6 py-6 ml-3">
          {/* Author + Category Section */}
          {note?.name && (
            <div className="flex items-center justify-between mb-8">
              {/* Author Mini-Profile */}
              <Link
                to={`/user-profile/${note.username}`}
                className="flex items-center transition-transform duration-300 ease-in-out hover:scale-105"
              >
                <div className="flex-shrink-0 relative group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-md transition-all duration-500 ease-in-out group-hover:shadow-xl group-hover:animate-pulse">
                    {note.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 transition-colors duration-300 hover:text-indigo-600">
                    Author
                  </p>
                  <p className="text-lg font-semibold text-gray-900 transition-colors duration-300 hover:text-indigo-800">
                    {note.name}
                  </p>
                </div>
              </Link>

              {/* Note Category on right */}
              {note.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {note.category}
                </span>
              )}
            </div>
          )}
          {/* Rating + Bookmark */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  className="p-1"
                  title={getAccessToken() ? `Rate ${i}` : "Login to rate"}
                  onClick={async () => {
                    if (!getAccessToken()) {
                      showFeedback("Login to rate", "error");
                      return;
                    }
                    try {
                      const url = `http://127.0.0.1:8000/api/user/notes/${note.slug}/rate/`;
                      const res = await axios.post(
                        url,
                        { value: i },
                        { headers: { ...authHeader() } }
                      );
                      setNote(res.data);
                      setUserRating(res.data?.user_rating ?? null);
                      try {
                        updateNoteInList(res.data);
                      } catch {
                        /* ignore */
                      }
                      showFeedback(`Rated ${i}★`, "rating");
                    } catch {
                      showFeedback("Failed to update rating", "error");
                    }
                  }}
                >
                  <FaStar
                    className={
                      (userRating ?? note.avg_rating) >= i
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {note.ratings_count || 0}
              </span>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-indigo-600 transition-colors"
              title={
                getAccessToken()
                  ? isBookmarked
                    ? "Remove bookmark"
                    : "Bookmark"
                  : "Login to bookmark"
              }
              onClick={async () => {
                if (!getAccessToken()) {
                  showFeedback("Login to bookmark", "error");
                  return;
                }
                const prev = isBookmarked;
                setIsBookmarked(!prev);
                try {
                  const url = `http://127.0.0.1:8000/api/user/notes/${note.slug}/bookmark/`;
                  if (prev) {
                    await axios.delete(url, { headers: { ...authHeader() } });
                    try {
                      updateNoteInList({ ...note, is_bookmarked: false });
                    } catch {
                      /* ignore */
                    }
                    showFeedback("Removed bookmark", "bookmark");
                  } else {
                    const res = await axios.post(
                      url,
                      {},
                      { headers: { ...authHeader() } }
                    );
                    setIsBookmarked(!!res.data?.is_bookmarked);
                    try {
                      updateNoteInList(res.data);
                    } catch {
                      /* ignore */
                    }
                    showFeedback("Bookmarked", "bookmark");
                  }
                } catch {
                  setIsBookmarked(prev);
                  showFeedback("Bookmark action failed", "error");
                }
              }}
            >
              {isBookmarked ? (
                <FaBookmark className="text-indigo-600" />
              ) : (
                <FaRegBookmark />
              )}
            </button>
          </div>
          <div className="w-full h-px bg-gray-300 my-6"></div>
          {/* Title Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {note?.title || "Untitled Note"}
            </h1>
          </div>

          {/* Date Information */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-8">
            <div className="flex items-center">
              <span className="mr-2">Created:</span>
              <span className="font-medium text-gray-700">
                {formatDate(note.created_at)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Updated:</span>
              <span className="font-medium text-gray-700">
                {formatDate(note.updated_at)}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-indigo-500 rounded-full mr-2"></span>
              Note Description
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {note.body || "No content available."}
              </p>
            </div>
          </div>

          {/* Attachments Section */}
          {note.attachments && note.attachments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full mr-2"></span>
                Attachments
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {note.attachments.map((att) => {
                  const isImage =
                    att.file_url &&
                    att.file_url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
                  const downloadUrl = `http://127.0.0.1:8000/api/user/download/attachment/${att.id}/`;
                  const fileName = att.file_url.split("/").pop();

                  return (
                    <div
                      key={att.id}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full h-full"
                          >
                            <img
                              src={att.file_url}
                              alt="Attachment"
                              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                            />
                          </a>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="bg-indigo-100 text-indigo-600 rounded-full p-3 mb-2">
                              <VscFileSubmodule className="w-8 h-8" />
                            </div>
                            <span className="text-xs text-gray-600 break-all px-2 line-clamp-2">
                              {fileName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex justify-between items-center bg-gray-50">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <FaEye className="w-3 h-3" />
                          View
                        </a>
                        <a
                          href={downloadUrl}
                          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium"
                        >
                          <FaDownload className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons (owner or admin) */}
          {(() => {
            const isOwner =
              currentUser &&
              note.username &&
              currentUser.trim().toLowerCase() ===
                note.username.trim().toLowerCase();
            const isAdmin =
              localStorage.getItem("is_admin") === "true" ||
              sessionStorage.getItem("is_admin") === "true";
            if (!(isOwner || isAdmin)) return null;
            return (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <Link to={`/edit-note/${slug}`}>
                  <button className="inline-flex items-center gap-2 bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition shadow-sm">
                    <FiEdit className="w-4 h-4" />
                    <span>Edit Note</span>
                  </button>
                </Link>

                <button
                  onClick={handleIsOpen}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
                >
                  <BiSolidTrashAlt className="w-4 h-4" />
                  <span>Delete Note</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isOpen && (
        <Modal
          handleIsOpen={handleIsOpen}
          deleteNote={() => performDelete(slug)}
        />
      )}
    </>
  );
};

export default NoteDetailPage;
