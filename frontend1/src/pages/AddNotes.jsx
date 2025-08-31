import React, { useState, useRef, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { NotesContext } from "../context/NotesContext";
import { useNavigate } from "react-router-dom";
import { authHeader, getAccessToken } from "../utils/auth";

function AddNotes() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [fileName, setFileName] = useState("No file chosen");
  const fileInputRef = useRef(null);
  const { addNoteToList } = useContext(NotesContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) {
      return;
    }
    setFiles((prev) => {
      // merge while avoiding duplicates (by name+size)
      const merged = [...prev];
      selectedFiles.forEach((sf) => {
        const exists = merged.some(
          (mf) => mf.name === sf.name && mf.size === sf.size
        );
        if (!exists) merged.push(sf);
      });
      // update displayed fileName
      if (merged.length === 0) setFileName("No file chosen");
      else if (merged.length === 1) setFileName(merged[0].name);
      else setFileName(`${merged.length} files selected`);
      return merged;
    });

    // clear input so the same file can be selected again if needed
    try {
      if (fileInputRef && fileInputRef.current)
        fileInputRef.current.value = null;
    } catch {
      // ignore
    }
  };

  const handleCustomButtonClick = () => {
    fileInputRef.current.click();
  };

  const removeSelectedFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) setFileName("No file chosen");
    else if (newFiles.length === 1) setFileName(newFiles[0].name);
    else setFileName(`${newFiles.length} files selected`);
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

  const postNote = async (formData, headers) => {
    return axios.post(
      "https://noresharing-app-fullstack-2.onrender.com/api/user/notes/",
      formData,
      {
        headers,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Category is compulsory
    if (!category) {
      toast.error("Please select a category for the note.", {
        position: "top-center",
      });
      return;
    }
    // Title and content are compulsory
    if (!title || title.trim() === "") {
      toast.error("Please enter a title for the note.", {
        position: "top-center",
      });
      return;
    }
    if (!content || content.trim() === "") {
      toast.error("Please enter content for the note.", {
        position: "top-center",
      });
      return;
    }
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("body", content.trim());
    formData.append("category", category);
    if (files && files.length > 0) {
      files.forEach((f) => formData.append("attachments", f));
    }

    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("You need to log in to add a note.", {
          position: "top-center",
        });
        navigate("/loginpage");
        return;
      }

      let headers = { ...authHeader() };
      let response;
      try {
        response = await postNote(formData, headers);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          // Try refresh once
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            headers = { Authorization: `Bearer ${newAccess}` };
            response = await postNote(formData, headers);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      addNoteToList(response.data);
      toast.success("Note added successfully!", { position: "top-center" });
      navigate("/", { state: { successMessage: "Note added successfully!" } });
    } catch (error) {
      console.error("Error adding note:", error);
      if (error.response) {
        const detail = error.response.data?.detail;
        if (detail) toast.error(detail, { position: "top-center" });
        else toast.error("Failed to add note.", { position: "top-center" });
        if (error.response.status === 401) {
          navigate("/loginpage");
        }
      } else {
        toast.error("Failed to add note.", { position: "top-center" });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Add New Note
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter note's title"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={4}
            placeholder="Enter note's content"
          ></textarea>
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Note's Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled>
              Pick a category
            </option>
            <option value="SCHOOL">School</option>
            <option value="PERSONAL">Personal</option>
            <option value="WORK">Work</option>
          </select>
        </div>

        {/* File/Image Upload */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Attach File/Image
          </label>
          <div className="relative overflow-hidden rounded border border-gray-300 focus-within:ring-2 focus-within:ring-blue-400">
            <div className="flex justify-between items-center px-3 py-2 bg-gray-50">
              <span className="text-sm text-gray-500 truncate">{fileName}</span>
              <button
                type="button"
                onClick={handleCustomButtonClick}
                className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-100 transition-colors flex items-center"
              >
                <i className="fas fa-cloud-upload-alt mr-1"></i> Choose File
              </button>
            </div>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          {files && files.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Selected: {fileName}</p>
              <ul className="list-disc list-inside mt-1">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between truncate max-w-xs"
                  >
                    <span className="mr-2">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(i)}
                      className="text-red-500 ml-2 text-sm hover:text-red-700"
                      aria-label={`Remove ${f.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add Note
        </button>
      </form>
    </div>
  );
}

export default AddNotes;
