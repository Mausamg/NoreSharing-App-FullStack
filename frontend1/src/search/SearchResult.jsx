import { useNavigate } from "react-router-dom";

function SearchResult({ results }) {
  const navigate = useNavigate();
  if (!results || results.length === 0) {
    return (
      <div className="bg-white shadow-md rounded p-4 text-gray-500 text-center">
        No results found
      </div>
    );
  }

  return (
    <ul className="bg-white shadow-md rounded p-2 max-h-64 overflow-y-auto">
      {results.map((note) => (
        <li
          key={note.id}
          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
          onClick={() => navigate(`/note-detail/${note.slug}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && navigate(`/note-detail/${note.slug}`)
          }
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <strong className="block text-sm font-semibold truncate">
                {note.title}
              </strong>
              <p className="text-xs text-gray-600 truncate mt-1">
                {note.body
                  ? note.body.slice(0, 80)
                  : note.content
                  ? note.content.slice(0, 80)
                  : "No preview"}
                ...
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs font-medium text-gray-500">
                {note.category}
              </div>
              {note.name && (
                <div className="text-xs text-gray-400">by {note.name}</div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default SearchResult;
