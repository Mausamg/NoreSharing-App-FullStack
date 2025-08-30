// import React from "react";
// import { LoadingSpinner } from "./LoadingSpinner";
// import PropTypes from "prop-types";

// export const Button = ({
//   variant = "primary",
//   size = "md",
//   loading = false,
//   children,
//   className = "",
//   disabled,
//   ...props
// }) => {
//   const baseClasses =
//     "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

//   const variantClasses = {
//     primary:
//       "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm",
//     secondary:
//       "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500 shadow-sm",
//     outline:
//       "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500",
//     ghost:
//       "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500",
//     danger:
//       "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm",
//   };

//   const sizeClasses = {
//     sm: "px-3 py-1.5 text-sm",
//     md: "px-4 py-2 text-sm",
//     lg: "px-6 py-3 text-base",
//   };

//   return (
//     <button
//       className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
//       disabled={disabled || loading}
//       {...props}
//     >
//       {loading && <LoadingSpinner size="sm" className="mr-2" />}
//       {children}
//     </button>
//   );
// };

// // ✅ PropTypes for type-checking in plain React
// Button.propTypes = {
//   variant: PropTypes.oneOf([
//     "primary",
//     "secondary",
//     "outline",
//     "ghost",
//     "danger",
//   ]),
//   size: PropTypes.oneOf(["sm", "md", "lg"]),
//   loading: PropTypes.bool,
//   children: PropTypes.node.isRequired,
//   className: PropTypes.string,
//   disabled: PropTypes.bool,
// };
