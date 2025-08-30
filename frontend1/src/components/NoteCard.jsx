import React, { useContext, useEffect, useRef, useState } from "react";
import { MdMarkunread } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { authHeader, getAccessToken } from "../utils/auth";
import axios from "axios";
// Inline feedback badges instead of global popups
import { FaRegBookmark, FaBookmark, FaStar } from "react-icons/fa";
import { NotesContext } from "../context/NotesContext";

function formatRelativeDate(dateString) {
  if (!dateString) return "No date";
  const date = new Date(dateString.replace(" ", "T"));
  if (isNaN(date.getTime())) return "Invalid Date";
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  // If more than a week, show date
  return date
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })
    .replace(",", "");
}

const NoteCard = ({ note }) => {
  const location = useLocation();
  const isFromUserProfile =
    typeof location?.pathname === "string" &&
    location.pathname.startsWith("/user-profile/");
  const backState = isFromUserProfile
    ? { fromUserProfile: location.pathname }
    : undefined;
  const body = note.body;
  const cat = note.category || "";
  const palette = {
    SCHOOL: {
      strip: "bg-blue-500",
      pill: "bg-blue-50 text-blue-700 border-blue-200",
      titleHover: "group-hover:text-blue-600",
      icon: "text-blue-500",
    },
    PERSONAL: {
      strip: "bg-green-500",
      pill: "bg-green-50 text-green-700 border-green-200",
      titleHover: "group-hover:text-green-600",
      icon: "text-green-500",
    },
    WORK: {
      strip: "bg-purple-500",
      pill: "bg-purple-50 text-purple-700 border-purple-200",
      titleHover: "group-hover:text-purple-600",
      icon: "text-purple-500",
    },
    DEFAULT: {
      strip: "bg-gray-400",
      pill: "bg-gray-50 text-gray-700 border-gray-200",
      titleHover: "group-hover:text-gray-700",
      icon: "text-gray-500",
    },
  };
  const theme = palette[cat] || palette.DEFAULT;
  const avatarSrc = note.avatar || "/default-avatar.svg";
  const [isBookmarked, setIsBookmarked] = useState(!!note.is_bookmarked);
  const [avgRating, setAvgRating] = useState(note.avg_rating ?? 0);
  const [ratingsCount, setRatingsCount] = useState(note.ratings_count ?? 0);
  const [userRating, setUserRating] = useState(note.user_rating ?? null);
  const { updateNoteInList } = useContext(NotesContext) || {};

  // Inline ephemeral feedback per-control (non-popup)
  const [ratingFeedback, setRatingFeedback] = useState(null); // { text, variant: 'rating'|'error' }
  const [ratingVisible, setRatingVisible] = useState(false);
  const ratingTimerRef = useRef(null);

  const [bookmarkFeedback, setBookmarkFeedback] = useState(null); // { text, variant: 'bookmark'|'error' }
  const [bookmarkVisible, setBookmarkVisible] = useState(false);
  const bookmarkTimerRef = useRef(null);

  const showRatingFeedback = (text, variant = "rating") => {
    if (ratingTimerRef.current) {
      clearTimeout(ratingTimerRef.current.hide);
      clearTimeout(ratingTimerRef.current.clear);
    }
    setRatingFeedback({ text, variant });
    setRatingVisible(true);
    const hide = setTimeout(() => setRatingVisible(false), 800);
    const clear = setTimeout(() => setRatingFeedback(null), 1000);
    ratingTimerRef.current = { hide, clear };
  };

  const showBookmarkFeedback = (text, variant = "bookmark") => {
    if (bookmarkTimerRef.current) {
      clearTimeout(bookmarkTimerRef.current.hide);
      clearTimeout(bookmarkTimerRef.current.clear);
    }
    setBookmarkFeedback({ text, variant });
    setBookmarkVisible(true);
    const hide = setTimeout(() => setBookmarkVisible(false), 800);
    const clear = setTimeout(() => setBookmarkFeedback(null), 1000);
    bookmarkTimerRef.current = { hide, clear };
  };

  // keep local state in sync with incoming props (for when details page updates and we return)
  useEffect(() => {
    setIsBookmarked(!!note.is_bookmarked);
  }, [note.is_bookmarked]);
  useEffect(() => {
    setAvgRating(note.avg_rating ?? 0);
    setRatingsCount(note.ratings_count ?? 0);
    setUserRating(note.user_rating ?? null);
  }, [note.avg_rating, note.ratings_count, note.user_rating]);
  const profilePath = note.username
    ? `/user-profile/${encodeURIComponent(note.username)}`
    : undefined;

  const toggleBookmark = async () => {
    if (!getAccessToken()) {
      showBookmarkFeedback("Login to bookmark", "error");
      return;
    }
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const url = `http://127.0.0.1:8000/api/user/notes/${note.slug}/bookmark/`;
      if (prev) {
        await axios.delete(url, { headers: { ...authHeader() } });
        if (updateNoteInList)
          updateNoteInList({ ...note, is_bookmarked: false });
        showBookmarkFeedback("Removed bookmark", "bookmark");
      } else {
        const res = await axios.post(url, {}, { headers: { ...authHeader() } });
        setIsBookmarked(!!res.data.is_bookmarked);
        if (updateNoteInList) updateNoteInList(res.data);
        showBookmarkFeedback("Bookmarked", "bookmark");
      }
    } catch {
      setIsBookmarked(prev);
      showBookmarkFeedback("Bookmark failed", "error");
    }
  };

  const sendRating = async (value) => {
    if (!getAccessToken()) {
      showRatingFeedback("Login to rate", "error");
      return;
    }
    const prevUser = userRating;
    const prevAvg = avgRating;
    const prevCnt = ratingsCount;
    // optimistic estimation
    let newAvg = prevAvg || 0;
    let newCnt = prevCnt;
    if (prevUser) {
      if (prevCnt > 0)
        newAvg = (prevAvg * prevCnt - prevUser + value) / prevCnt;
    } else {
      newCnt = prevCnt + 1;
      newAvg = (prevAvg * prevCnt + value) / newCnt;
    }
    setUserRating(value);
    setAvgRating(Number.isFinite(newAvg) ? parseFloat(newAvg.toFixed(1)) : 0);
    setRatingsCount(newCnt);
    try {
      const url = `http://127.0.0.1:8000/api/user/notes/${note.slug}/rate/`;
      const res = await axios.post(
        url,
        { value },
        { headers: { ...authHeader() } }
      );
      setAvgRating(res.data.avg_rating ?? 0);
      setRatingsCount(res.data.ratings_count ?? 0);
      setUserRating(res.data.user_rating ?? null);
      showRatingFeedback(`Rated ${value}★`, "rating");
    } catch {
      setUserRating(prevUser);
      setAvgRating(prevAvg);
      setRatingsCount(prevCnt);
      showRatingFeedback("Rating failed", "error");
    }
  };

  const Star = ({ index }) => {
    const filled = (userRating ?? avgRating) >= index;
    return (
      <button
        type="button"
        aria-label={`Rate ${index} star`}
        className="p-0.5"
        onClick={() => sendRating(index)}
        title={getAccessToken() ? `Rate ${index}` : "Login to rate"}
      >
        <FaStar className={filled ? "text-yellow-400" : "text-gray-300"} />
      </button>
    );
  };

  return (
    <div className="w-full md:w-4/12 px-3 mb-4">
      <div className="bg-white rounded-lg shadow-sm p-4 relative flex flex-col  border border-gray-100 hover:shadow-md transition-shadow duration-200 w-100 max-h-55 min-h-55">
        {/* Side strip */}
        <span
          className={`absolute left-0 top-0 h-full w-1 rounded-l ${theme.strip}`}
        ></span>

        {/* User mini-profile header */}
        <div className="flex items-center gap-3 mb-3">
          {profilePath ? (
            <Link to={profilePath} className="shrink-0">
              <img
                src={avatarSrc}
                alt={note.name ? `${note.name}'s avatar` : "User avatar"}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                onError={(e) => {
                  e.currentTarget.src = "/default-avatar.svg";
                }}
              />
            </Link>
          ) : (
            <img
              src={avatarSrc}
              alt={note.name ? `${note.name}'s avatar` : "User avatar"}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.svg";
              }}
            />
          )}
          <div className="min-w-0">
            {note.name ? (
              profilePath ? (
                <Link
                  to={profilePath}
                  className="block text-sm font-semibold text-gray-900 truncate hover:underline"
                  title={note.name}
                >
                  {note.name}
                </Link>
              ) : (
                <div
                  className="text-sm font-semibold text-gray-900 truncate"
                  title={note.name}
                >
                  {note.name}
                </div>
              )
            ) : (
              <div className="text-sm font-semibold text-gray-700">
                Unknown User
              </div>
            )}
            <div className="text-xs text-gray-500">
              {formatRelativeDate(note.updated_at || note.created_at || "")}
            </div>
          </div>
          {/* Category pill on the right */}
          {note.category && (
            <span
              className={`ml-auto inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium capitalize ${theme.pill}`}
            >
              {note.category.toLowerCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          to={`/note-detail/${note.slug}`}
          state={backState}
          className="group no-underline text-black flex-1 min-w-0"
        >
          <h5
            className={`text-lg font-semibold truncate transition-colors duration-150 ${theme.titleHover}`}
          >
            {note.title}
          </h5>
        </Link>

        {/* Note content */}
        <div className="mt-2 mb-4">
          <p
            className="text-gray-600 text-sm leading-relaxed line-clamp-2 overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {body}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {/* Rating & count */}
          <div className="flex items-center gap-1 relative">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} index={i} />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {ratingsCount || 0}
            </span>
            {/* Rating feedback below rating controls */}
            {ratingFeedback && (
              <div
                className={`absolute left-0 top-full mt-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-sm ring-1 transition-all duration-200 ${
                  ratingVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-1"
                } ${
                  ratingFeedback.variant === "rating"
                    ? "bg-amber-100 text-amber-700 ring-amber-200"
                    : "bg-red-100 text-red-700 ring-red-200"
                }`}
                role="status"
                aria-live="polite"
              >
                <span className="inline-flex items-center gap-1">
                  {ratingFeedback.variant === "rating" && (
                    <FaStar className="text-amber-400" />
                  )}
                  {ratingFeedback.text}
                </span>
              </div>
            )}
          </div>
          <Link
            to={`/note-detail/${note.slug}`}
            state={backState}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <MdMarkunread className={`text-xl ${theme.icon}`} />
            <span className="hidden sm:inline">Read</span>
          </Link>
          {/* Bookmark toggle */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={toggleBookmark}
              className="text-gray-500 hover:text-indigo-600 transition-colors"
              title={
                getAccessToken()
                  ? isBookmarked
                    ? "Remove bookmark"
                    : "Bookmark"
                  : "Login to bookmark"
              }
            >
              {isBookmarked ? (
                <FaBookmark className="text-indigo-600" />
              ) : (
                <FaRegBookmark />
              )}
            </button>
            {/* Bookmark feedback below the bookmark button */}
            {bookmarkFeedback && (
              <div
                className={`absolute right-0 top-full mt-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-sm ring-1 transition-all duration-200 ${
                  bookmarkVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-1"
                } ${
                  bookmarkFeedback.variant === "bookmark"
                    ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                    : "bg-red-100 text-red-700 ring-red-200"
                }`}
                role="status"
                aria-live="polite"
              >
                <span className="inline-flex items-center gap-1">
                  {bookmarkFeedback.variant === "bookmark" && (
                    <FaBookmark className="text-indigo-600" />
                  )}
                  {bookmarkFeedback.text}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
