// import React from "react";
// import {
//   Edit,
//   Trash2,
//   Calendar,
//   Heart,
//   MessageCircle,
//   FileText,
// } from "lucide-react";

// import { Button } from "../components/Button";
// import PropTypes from "prop-types";
// const UserProfile = ({
//   user,
//   userNotes,
//   onEditNote,
//   onDeleteNote,
//   onViewNote,
// }) => {
//   // Guard against undefined props
//   if (!user || !userNotes) {
//     return <div>Loading...</div>;
//   }

//   const stats = [
//     {
//       label: "Notes",
//       value: user.totalNotes || 0,
//       icon: FileText,
//       color: "text-blue-600",
//     },
//     {
//       label: "Likes",
//       value: user.totalLikes || 0,
//       icon: Heart,
//       color: "text-red-600",
//     },
//     {
//       label: "Comments",
//       value: user.totalComments || 0,
//       icon: MessageCircle,
//       color: "text-green-600",
//     },
//   ];
//   // src/utils/dateUtils.js

//   const formatTimeAgo = (dateString) => {
//     const now = new Date();
//     const date = new Date(dateString);
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

//     if (diffInSeconds < 60) {
//       return "Just now";
//     }

//     const diffInMinutes = Math.floor(diffInSeconds / 60);
//     if (diffInMinutes < 60) {
//       return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
//     }

//     const diffInHours = Math.floor(diffInMinutes / 60);
//     if (diffInHours < 24) {
//       return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
//     }

//     const diffInDays = Math.floor(diffInHours / 24);
//     if (diffInDays < 7) {
//       return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
//     }

//     const diffInWeeks = Math.floor(diffInDays / 7);
//     if (diffInWeeks < 4) {
//       return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
//     }

//     const diffInMonths = Math.floor(diffInDays / 30);
//     if (diffInMonths < 12) {
//       return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
//     }

//     const diffInYears = Math.floor(diffInDays / 365);
//     return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   return (
//     <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       {/* Profile Header */}
//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
//           <img
//             src={user.avatar}
//             alt={user.username}
//             className="w-24 h-24 rounded-full object-cover"
//           />
//           <div className="flex-1">
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               {user.username}
//             </h1>
//             <p className="text-gray-600 dark:text-gray-400 mb-4">
//               {user.email}
//             </p>
//             <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
//               <Calendar className="w-4 h-4" />
//               <span>Joined {formatDate(user.createdAt)}</span>
//             </div>
//           </div>
//           <Button variant="outline">
//             <Edit className="w-4 h-4 mr-2" />
//             Edit Profile
//           </Button>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
//           {stats.map(({ label, value, icon: Icon, color }) => (
//             <div key={label} className="text-center">
//               <div className="flex items-center justify-center mb-2">
//                 <Icon className={`w-6 h-6 ${color}`} />
//               </div>
//               <div className="text-2xl font-bold text-gray-900 dark:text-white">
//                 {value}
//               </div>
//               <div className="text-sm text-gray-600 dark:text-gray-400">
//                 {label}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* User Notes */}
//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
//           My Notes ({userNotes.length})
//         </h2>

//         {userNotes.length === 0 ? (
//           <div className="text-center py-12">
//             <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
//               No notes yet
//             </h3>
//             <p className="text-gray-500 dark:text-gray-400 mb-4">
//               Start sharing your knowledge with the community!
//             </p>
//             <Button>Upload Your First Note</Button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {userNotes.map((note) => (
//               <div
//                 key={note.id}
//                 className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                       {note.title}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
//                       {note.description}
//                     </p>

//                     <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
//                       <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
//                         {note.subject}
//                       </span>
//                       <span>{formatTimeAgo(note.createdAt)}</span>
//                       <div className="flex items-center space-x-1">
//                         <Heart className="w-4 h-4" />
//                         <span>{note.likes}</span>
//                       </div>
//                       <div className="flex items-center space-x-1">
//                         <MessageCircle className="w-4 h-4" />
//                         <span>{note.commentsCount}</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="flex items-center space-x-2 ml-4">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => onViewNote(note.id)}
//                     >
//                       View
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => onEditNote(note.id)}
//                     >
//                       <Edit className="w-4 h-4" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => onDeleteNote(note.id)}
//                       className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// UserProfile.propTypes = {
//   user: PropTypes.shape({
//     username: PropTypes.string.isRequired,
//     email: PropTypes.string.isRequired,
//     avatar: PropTypes.string,
//     createdAt: PropTypes.string.isRequired,
//     totalNotes: PropTypes.number,
//     totalLikes: PropTypes.number,
//     totalComments: PropTypes.number,
//   }).isRequired,
//   userNotes: PropTypes.arrayOf(
//     PropTypes.shape({
//       id: PropTypes.string.isRequired,
//       title: PropTypes.string.isRequired,
//       description: PropTypes.string,
//       subject: PropTypes.string,
//       createdAt: PropTypes.string.isRequired,
//       likes: PropTypes.number,
//       commentsCount: PropTypes.number,
//     })
//   ).isRequired,
//   onEditNote: PropTypes.func.isRequired,
//   onDeleteNote: PropTypes.func.isRequired,
//   onViewNote: PropTypes.func.isRequired,
// };
// export default UserProfile;

// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

const UserProfile = () => {
  // const { username } = useParams();
  // const [userProfile, setUserProfile] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  // useEffect(() => {
  //   if (!username) return;

  //   axios
  //     .get(`http://127.0.0.1:8000/api/user/profile/${username}/`)
  //     .then((res) => {
  //       setUserProfile(res.data);
  //       setLoading(false);
  //     })
  //     .catch(() => {
  //       setError("Failed to load user profile");
  //       setLoading(false);
  //     });
  // }, [username]);

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;
  // if (!userProfile) return <div>User not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
          {/* {userProfile.name.charAt(0).toUpperCase()} */}
        </div>
        <div>
          <h2 className="text-xl font-semibold">name</h2>
          <p className="text-sm text-gray-500">hello</p>
        </div>
      </div>
      {/* You can add user’s notes, bio, etc. here */}
    </div>
  );
};

export default UserProfile;
