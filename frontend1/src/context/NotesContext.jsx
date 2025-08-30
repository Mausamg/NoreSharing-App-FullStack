import React, { useState } from "react";
import { NotesContext } from "./NotesContext";

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);

  const addNoteToList = (newNote) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  const updateNotesList = (updatedNotes) => {
    setNotes(updatedNotes);
  };

  return (
    <NotesContext.Provider value={{ notes, addNoteToList, updateNotesList }}>
      {children}
    </NotesContext.Provider>
  );
};
