import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { authHeader, getAccessToken } from "../utils/auth";
import { NotesContext } from "../context/NotesContext";

const EditNote = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileNames, setFileNames] = useState("No files chosen");
  const fileInputRef = useRef(null);

  const { slug } = useParams();
  const navigate = useNavigate();
  const { notes, updateNotesList } = useContext(NotesContext);

  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://noresharing-app-fullstack-2.onrender.com/api/user/notes/${slug}/`
        );
        setTitle(response.data.title);
        setBody(response.data.body);
        setCategory(response.data.category);
        setExistingAttachments(response.data.attachments || []);
      } catch (err) {
        setError("Failed to fetch note: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [slug]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setAttachments((prev) => {
      const merged = [...prev];
      selectedFiles.forEach((sf) => {
        const exists = merged.some(
          (mf) => mf.name === sf.name && mf.size === sf.size
        );
        if (!exists) merged.push(sf);
      });

      if (merged.length === 0) setFileNames("No files chosen");
      else if (merged.length === 1) setFileNames(merged[0].name);
      else setFileNames(`${merged.length} file(s) selected`);

      return merged;
    });

    // reset input so same file can be selected again
    try {
      if (fileInputRef && fileInputRef.current)
        fileInputRef.current.value = null;
    } catch {
      // ignore
    }
  };
  // Create object URLs for new attachments so they can be opened immediately
  useEffect(() => {
    // cleanup previous previews
    setAttachmentPreviews((prev) => {
      if (prev && prev.length > 0) {
        prev.forEach((u) => URL.revokeObjectURL(u));
      }
      return [];
    });

    if (!attachments || attachments.length === 0) return;
    const urls = attachments.map((f) => URL.createObjectURL(f));
    setAttachmentPreviews(urls);
    // cleanup when attachments change or component unmounts
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [attachments]);

  const removeNewAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);

    // Update file names display
    if (newAttachments.length === 0) {
      setFileNames("No files chosen");
    } else {
      setFileNames(`${newAttachments.length} file(s) selected`);
    }
  };

  const removeExistingAttachment = (index) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const refreshAccessToken = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");
    if (!refreshToken) return null;
    try {
      const res = await axios.post(
        "https://noresharing-app-fullstack-2.onrender.com/api/token/refresh/",
        {
          refresh: refreshToken,
        }
      );
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title && !body && !category) {
      setError("Please fill in at least one field");
      return;
    }

    try {
      setIsLoading(true);

      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);
      formData.append("category", category);

      // Append each new file
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      // Append list of existing attachment IDs to keep (backend expects ids)
      const existingIds = (existingAttachments || [])
        .map((att) => (att && att.id ? att.id : null))
        .filter((id) => id !== null);
      formData.append("existingAttachments", JSON.stringify(existingIds));

      // Ensure we send Authorization header
      let headers = { ...authHeader() };
      if (!getAccessToken()) {
        // No token at all
        setError("You must be logged in to edit a note.");
        navigate("/loginpage");
        return;
      }

      // Try request, refresh once on 401 — capture response so we can update context
      let response = null;
      try {
        response = await axios.put(
          `https://noresharing-app-fullstack-2.onrender.com/api/user/notes/${slug}/`,
          formData,
          { headers }
        );
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            headers = { Authorization: `Bearer ${newAccess}` };
            response = await axios.put(
              `https://noresharing-app-fullstack-2.onrender.com/api/user/notes/${slug}/`,
              formData,
              { headers }
            );
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // If we have an updated note from the server, update the NotesContext so homepage reflects changes
      const updatedNote = response?.data;
      try {
        if (updatedNote && updateNotesList) {
          const exists =
            Array.isArray(notes) && notes.some((n) => n.id === updatedNote.id);
          const newList = exists
            ? notes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
            : [updatedNote, ...(Array.isArray(notes) ? notes : [])];
          updateNotesList(newList);
        }
      } catch (e) {
        console.error("Failed to update notes context:", e);
      }

      // Redirect to detail page and pass a success message in navigation state
      // NoteDetails will show the toast to avoid duplicates
      navigate(`/note-detail/${slug}`, {
        state: { successMessage: "Note updated successfully!" },
      });
    } catch (err) {
      // Show server-provided details when available
      const serverMsg =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.response?.data ||
        err.message;
      setError(
        "Failed to update note: " +
          (typeof serverMsg === "string"
            ? serverMsg
            : JSON.stringify(serverMsg))
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !title) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md flex justify-center items-center h-64">
        <div className="text-blue-600 text-lg">Loading note...</div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-100 mx-auto p-6 bg-white rounded-xl shadow-md space-y-5"
    >
      <h2 className="text-2xl pl-23 font-bold text-gray-800">Update Note</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Enter note's title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label
          htmlFor="body"
          className="block text-sm font-medium text-gray-700"
        >
          Content
        </label>
        <textarea
          id="body"
          rows={6}
          placeholder="Enter note's content"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        ></textarea>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Note's Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="" disabled>
            Pick a category
          </option>
          <option value="SCHOOL">School</option>
          <option value="PERSONAL">Personal</option>
          <option value="WORK">Work</option>
        </select>
      </div>

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Existing Attachments
          </label>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {existingAttachments.map((att, index) => {
              const url = att?.file_url || att?.file || "";
              const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
              const fileName = url.split("/").pop();
              return (
                <div
                  key={att?.id || index}
                  className="p-2 border rounded-lg bg-gray-50 flex flex-col items-center text-xs relative"
                >
                  <button
                    type="button"
                    onClick={() => removeExistingAttachment(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                  {isImage ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block"
                    >
                      <img
                        src={url}
                        alt={fileName}
                        className="h-24 w-full object-cover rounded-md"
                      />
                    </a>
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-24 w-full flex items-center justify-center bg-gray-200 rounded-md"
                    >
                      <span className="text-2xl">📄</span>
                    </a>
                  )}
                  <p className="truncate w-full text-gray-600 mt-1 text-center">
                    {fileName}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Attachments */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Add New Attachments
        </label>

        {/* Custom file input */}
        <div className="relative overflow-hidden rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <div className="flex justify-between items-center px-3 py-2 bg-gray-50">
            <span className="text-sm text-gray-500 truncate">{fileNames}</span>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold ml-2 flex items-center">
              <i className="fas fa-cloud-upload-alt mr-1"></i> Choose Files
            </span>
          </div>
          <input
            type="file"
            id="attachments"
            multiple
            accept="image/*,.pdf,.docx,.txt"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Preview new attachments */}
        {attachments.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">New files to upload:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((file, index) => {
                const previewUrl = attachmentPreviews[index];
                const isImage = file.type && file.type.startsWith("image/");
                return (
                  <div
                    key={index}
                    className="p-2 border rounded-lg bg-gray-50 flex flex-col items-center text-xs relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeNewAttachment(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                    {isImage && previewUrl ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block"
                      >
                        <img
                          src={previewUrl}
                          alt={file.name}
                          className="h-24 w-full object-cover rounded-md"
                        />
                      </a>
                    ) : previewUrl ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-24 w-full flex items-center justify-center bg-gray-200 rounded-md"
                      >
                        <span className="text-2xl">📄</span>
                      </a>
                    ) : (
                      <div className="h-24 w-full flex items-center justify-center bg-gray-200 rounded-md">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <p className="truncate w-full text-gray-600 mt-1 text-center">
                      {file.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Updating..." : "Update Note"}
      </button>
    </form>
  );
};

export default EditNote;
