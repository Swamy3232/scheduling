import React, { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "worker",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://manpower.cmti.online/auth/signup", 
        formData, 
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setMessage({
        type: "success",
        text: `✅ Worker account "${response.data.username}" created successfully!`
      });
      
      setFormData({ 
        username: "", 
        email: "", 
        password: "", 
        role: "worker" 
      });
    } catch (err) {
      console.error("Signup error:", err);
      
      let errorMessage = "Something went wrong. Please try again.";
      let fieldErrors = {};
      
      if (err.response?.data?.detail) {
        const errorDetail = err.response.data.detail;
        
        if (typeof errorDetail === 'string') {
          if (errorDetail.toLowerCase().includes("email") || 
              errorDetail.toLowerCase().includes("user") ||
              errorDetail.toLowerCase().includes("already") ||
              errorDetail.toLowerCase().includes("exist")) {
            errorMessage = "This email address or username is already registered.";
            fieldErrors = { 
              email: "Email already registered",
              username: "Username already taken"
            };
          } else {
            errorMessage = errorDetail;
          }
        } else if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail[0]?.msg || "Validation error";
        }
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        errorMessage = "Unable to connect to server. Please check your internet connection.";
      }

      setMessage({
        type: "error",
        text: errorMessage
      });
      setErrors(fieldErrors);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      {/* Left Side - Management Panel */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent z-20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-30 p-16 flex flex-col justify-center text-white w-full">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Team Management
              </span>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Add New <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Team Member</span>
            </h1>
            <p className="text-lg text-gray-300 mb-12 leading-relaxed">
              Create worker accounts to manage your team efficiently. Set appropriate access levels and permissions.
            </p>
            
            {/* Management Features */}
            <div className="space-y-4">
              {[
                "Set role-based permissions",
                "Track worker activities", 
                "Manage access levels",
                "Monitor team performance"
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Add Worker
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Create Worker Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Add new member to your team
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Create Worker Account
            </h2>
            <p className="text-gray-300 text-lg">
              Fill in worker details to create account
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8 lg:p-10">
            {message && (
              <div className={`mb-8 p-4 rounded-2xl border ${
                message.type === "success" 
                  ? "bg-green-500/10 border-green-400/30 text-green-200" 
                  : "bg-red-500/10 border-red-400/30 text-red-200"
              }`}>
                <div className="flex items-center">
                  {message.type === "success" ? (
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Worker Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 rounded-2xl border-2 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.username 
                        ? "border-red-400/50 focus:border-red-400 focus:ring-red-400/20" 
                        : "border-white/10 focus:border-blue-400 focus:ring-blue-400/20"
                    }`}
                    placeholder="Enter worker username"
                    required
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-300 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Worker Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 rounded-2xl border-2 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.email 
                        ? "border-red-400/50 focus:border-red-400 focus:ring-red-400/20" 
                        : "border-white/10 focus:border-blue-400 focus:ring-blue-400/20"
                    }`}
                    placeholder="Enter worker email address"
                    required
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-300 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Worker Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 rounded-2xl border-2 bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.password 
                        ? "border-red-400/50 focus:border-red-400 focus:ring-red-400/20" 
                        : "border-white/10 focus:border-blue-400 focus:ring-blue-400/20"
                    }`}
                    placeholder="Set worker password"
                    required
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-300 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Worker Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                    required
                  >
                    <option value="user" className="bg-slate-800">Project Associate</option>
                    {/* <option value="manager" className="bg-slate-800">Manager</option> */}
                    <option value="admin" className="bg-slate-800">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-5 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400/30 transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center text-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Worker Account...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Worker Account
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm">
                Manage existing workers?{" "}
                <a href="/workers" className="text-blue-400 hover:text-cyan-400 font-semibold transition-colors duration-200 hover:underline">
                  View all workers
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}