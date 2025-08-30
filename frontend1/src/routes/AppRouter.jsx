import { Routes, Route, useParams } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AddNotes from "../pages/AddNotes";
import MyNotes from "../pages/MyNotes";
import ProtectedRoute from "./ProtectedRouter";
import NoteDetails from "../pages/NoteDetails";
import LoginForm from "../auth/LoginForm";
import RegisterForm from "../auth/RegisterForm";
import Forgotpass from "../auth/Forgotpass";
import { Link } from "react-router-dom";
import ResetPassword from "../auth/ResetPassword";
import EditNote from "../pages/EditNote";
import UserProfile from "../pages/UserProfile";
import PublicProfile from "../pages/profile/PublicProfile";
import MyProfile from "../pages/profile/MyProfile";
import AdminUsers from "../pages/admin/AdminUsers";

function AppRouter(props) {
  const currentUser = props.currentUser;
  const currentUserName = currentUser?.name; // Use name instead of username for consistency
  const isAdmin = Boolean(
    localStorage.getItem("is_admin") === "true" ||
      sessionStorage.getItem("is_admin") === "true"
  );

  // Wrapper component to extract :category and pass as prop
  const FilterRoute = () => {
    const { category } = useParams();
    return <HomePage filterCategory={category} />;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage filterCategory={props.filterCategory} />}
      />
      <Route path="/filter/:category" element={<FilterRoute />} />
      <Route
        path="/add-notes"
        element={
          <ProtectedRoute>
            <AddNotes />
          </ProtectedRoute>
        }
      />
      <Route path="/loginpage" element={<LoginForm />} />
      <Route path="/Registerpage" element={<RegisterForm />} />
      <Route path="/forgot-password" element={<Forgotpass />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
      <Route
        path="/note-detail/:slug"
        element={
          <NoteDetails
            currentUser={currentUser}
            currentUserName={currentUserName}
          />
        }
      />
      <Route
        path="/edit-note/:slug"
        element={
          <EditNote
            currentUser={currentUser}
            currentUserName={currentUserName}
          />
        }
      />
      <Route path="/user-profile/:username" element={<PublicProfile />} />
      <Route path="/user-profile/:username/notes" element={<PublicProfile />} />
      {/** Analytics for public profiles removed to keep analytics private */}
      <Route
        path="/my-notes"
        element={
          <ProtectedRoute>
            <MyNotes currentUserName={currentUserName} />
          </ProtectedRoute>
        }
      />
      {/* Profile routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/notes"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/saved"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/analytics"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/settings"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            {isAdmin ? <AdminUsers /> : <HomePage />}
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center animate-fade-in-up">
              {/* Animated 404 text */}
              <div className="flex justify-center items-center mb-6">
                <span className="text-9xl font-bold text-purple-600 animate-bounce">
                  4
                </span>
                <span className="text-9xl font-bold text-blue-600 animate-bounce delay-75">
                  0
                </span>
                <span className="text-9xl font-bold text-purple-600 animate-bounce delay-150">
                  4
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Oops! Page Not Found
              </h1>
              <p className="text-gray-600 mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>

              {/* Interactive search */}
              <div className="relative mb-8">
                <input
                  type="text"
                  placeholder="Search our site..."
                  className="w-full p-4 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation options */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => window.history.back()}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Go Back
                </button>
                <Link
                  to="/"
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 20a1 1 0 01-1-1v-7H5a1 1 0 01-1-1V7a1 1 0 01.293-.707l7-7a1 1 0 011.414 0l7 7A1 1 0 0120 7v4a1 1 0 01-1 1h-4v7a1 1 0 01-1 1z" />
                  </svg>
                  Home
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default AppRouter;
