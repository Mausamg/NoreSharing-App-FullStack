import React, { useEffect, useState } from "react";
import api from "../utils/axiosInterceptor";
import { NotesContext } from "./NotesContext";

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/user/notes/");
      setNotes(res.data || []);
    } catch (e) {
      console.error("Failed to load notes:", e);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNotes();
  }, []);

  const addNoteToList = (newNote) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  const updateNotesList = (updatedNotes) => {
    setNotes(updatedNotes);
  };

  const updateNoteInList = (updatedNote) => {
    if (!updatedNote) return;
    setNotes((prev) =>
      Array.isArray(prev)
        ? prev.map((n) =>
            n.slug === updatedNote.slug ? { ...n, ...updatedNote } : n
          )
        : prev
    );
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        error,
        addNoteToList,
        updateNotesList,
        updateNoteInList,
        refreshNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};
