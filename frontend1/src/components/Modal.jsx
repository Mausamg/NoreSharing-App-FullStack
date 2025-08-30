import React, { useEffect } from "react";

const Modal = ({ handleIsOpen, deleteNote }) => {
  // Notify other components (Navbar) that a modal is open so they can dim UI
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("modal:toggle", { detail: { open: true } })
    );
    return () =>
      window.dispatchEvent(
        new CustomEvent("modal:toggle", { detail: { open: false } })
      );
  }, []);

  const handleDeleteNote = () => {
    // let caller perform deletion, navigation and toast to avoid duplicates
    deleteNote();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40"
      style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
        style={{ zIndex: 9999 }}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
          onClick={handleIsOpen}
        >
          ×
        </button>

        {/* Content */}
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Delete Note</h2>
          <p className="text-gray-600">
            Are you sure you want to delete this note?
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              onClick={handleDeleteNote}
            >
              Delete
            </button>
            <button
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              onClick={handleIsOpen}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
