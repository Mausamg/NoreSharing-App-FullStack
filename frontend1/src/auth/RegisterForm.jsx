import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    password2: "",
    tc: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const password = formData.password;

    // Name validation
    if (!formData.name.trim()) newErrors.name = "Name is required";

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else {
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        newErrors.password =
          "Password must contain at least one special character";
      }
    }

    // Confirm password
    if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
    }

    // Terms & Conditions
    if (!formData.tc) newErrors.tc = "You must agree to the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({}); // reset errors

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/user/register/",
        formData
      );

      setSuccess("Registration successful! You can now log in.");
      console.log("Registration response:", response.data);
      // Pass success message to Login page via navigation state
      navigate("/Loginpage", {
        replace: true,
        state: {
          success: "Account created successfully. Please sign in.",
        },
      });
    } catch (error) {
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const formattedErrors = {};

        // Map backend errors (e.g., { email: ["This email is already taken"] })
        for (let key in apiErrors) {
          formattedErrors[key] = Array.isArray(apiErrors[key])
            ? apiErrors[key][0]
            : apiErrors[key];
        }

        setErrors(formattedErrors);
      } else {
        setErrors({ server: "Network error. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {errors.server && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {errors.server}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errors.server && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {errors.server}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}

            {/* Password */}
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border rounded"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showPwd2 ? "text" : "password"}
                name="password2"
                placeholder="Confirm Password"
                value={formData.password2}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border rounded"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd2((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPwd2 ? "Hide password" : "Show password"}
              >
                {showPwd2 ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password2 && (
              <p className="text-sm text-red-600">{errors.password2}</p>
            )}

            {/* Terms & Conditions */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                name="tc"
                checked={formData.tc}
                onChange={handleChange}
                className="mr-2"
              />
              I agree to the terms and conditions
            </label>
            {errors.tc && <p className="text-sm text-red-600">{errors.tc}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 mt-2">
              Already have an account?{" "}
              <Link
                to="/Loginpage"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
