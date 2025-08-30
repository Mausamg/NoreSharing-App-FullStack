import NoteCard from "./NoteCard";

const NoteCardContainer = ({ notes, mounted = true }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-340 min-h-screen p-4 mb-4 ml-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {notes.map((note, idx) => (
          <div
            key={note.id}
            // Subtle fade + upward translate + small scale pop-in on first mount only.
            className={`transition-opacity duration-300 ease-out transform motion-reduce:transition-none motion-reduce:transform-none ${
              mounted
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95"
            }`}
            style={{ transitionDelay: mounted ? `${idx * 40}ms` : "0ms" }}
          >
            <NoteCard note={note} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteCardContainer;
