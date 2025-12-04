import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/download.webp";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Attempting login...");
      const res = await axios.post(
        "https://manpower.cmti.online/auth/login", 
        formData, 
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Login success response:", res.data);
      
      // IMPORTANT: The API might return different structure
      // Let's check what we actually get
      console.log("📋 Response structure analysis:", {
        hasAccessToken: !!res.data.access_token,
        hasRole: !!res.data.role,
        hasUsername: !!res.data.username,
        fullData: res.data
      });
      
      // Store token for other API calls
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
      }
      
      // Also need to store user info in the format WorkerDashboard expects
      const userData = {
        // Try different possible fields from the response
        username: res.data.username || formData.username || res.data.user?.username,
        role: res.data.role?.toLowerCase() || res.data.user?.role?.toLowerCase() || "worker",
        message: res.data.message || "Login successful"
      };
      
      console.log("💾 Storing user data:", userData);
      
      // Store in localStorage as 'user' object (what WorkerDashboard expects)
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Also store role separately for compatibility
      localStorage.setItem("role", userData.role);
      localStorage.setItem("isLoggedIn", "true");
      
      // Verify storage
      const storedUser = localStorage.getItem("user");
      console.log("✅ Stored in localStorage (user):", storedUser);
      
      // Notify Navbar
      window.dispatchEvent(new Event("authChange"));
      
      // Add a small delay to ensure localStorage is written
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
      
    } catch (err) {
      console.error("❌ Login error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      // More specific error messages
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err.response?.status === 404) {
        setError("Login service unavailable. Please try again later.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please contact administrator.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Add a debug function to test different endpoints
  const testLoginEndpoints = async () => {
    const endpoints = [
      "https://manpower.cmti.online/auth/login",
      "https://manpower.cmti.online/login/", // Your original endpoint
      "https://manpower.cmti.online/login"   // Without trailing slash
    ];
    
    console.log("🔍 Testing login endpoints...");
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const testRes = await axios.post(endpoint, formData, {
          headers: { "Content-Type": "application/json" }
        });
        console.log(`✅ ${endpoint} works:`, testRes.data);
        return endpoint;
      } catch (err) {
        console.log(`❌ ${endpoint} failed:`, err.message);
      }
    }
    return null;
  };

  // Debug: Check what's currently in localStorage
  const checkLocalStorage = () => {
    console.log("📋 Current localStorage contents:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}: ${localStorage.getItem(key)}`);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl h-[85vh] mx-auto flex rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Left Side - Branding Section */}
          <div className="flex-1 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent opacity-5"></div>
            </div>
            
            <div className="relative z-10">
              {/* Logo Section */}
              <div className="mb-12">
                <div className="flex items-center mb-8">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mr-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <div className="text-blue-900 font-bold text-3xl tracking-tight">AMC</div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">Advanced Material</h1>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Characterization</h1>
                  </div>
                </div>
                
                <div className="border-l-4 border-white pl-6 mb-10">
                  <h2 className="text-5xl font-light mb-3 text-white tracking-wide">CMTI</h2>
                  <p className="text-blue-200 text-xl font-medium">Central Manufacturing Technology Institute</p>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-6">
                <div className="flex items-center transform hover:translate-x-2 transition-transform duration-300">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-blue-100 text-lg font-medium">Workforce Management & Scheduling</span>
                </div>
                <div className="flex items-center transform hover:translate-x-2 transition-transform duration-300">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-blue-100 text-lg font-medium">Equipment Slot Reservation</span>
                </div>
                <div className="flex items-center transform hover:translate-x-2 transition-transform duration-300">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-blue-100 text-lg font-medium">Real-time Resource Tracking</span>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="relative z-10 pt-8 border-t border-blue-600">
              <p className="text-blue-200 text-base leading-relaxed">
                Secure access to advanced material characterization laboratory resources and workforce management tools. 
                Enterprise-grade security and reliability.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 bg-white p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full"></div>
            
            <div className="max-w-md w-full mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Welcome Back</h2>
                <p className="text-gray-600 text-lg">Sign in to your AMC Portal account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-start shadow-sm">
                  <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide text-xs">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      autoComplete="username"
                      className="block w-full pl-12 pr-4 py-5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg hover:border-gray-300"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide text-xs">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      className="block w-full pl-12 pr-4 py-5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg hover:border-gray-300"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-5 px-6 rounded-2xl font-bold text-white focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300 shadow-lg ${
                    isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-lg">Signing In...</span>
                    </div>
                  ) : (
                    <span className="text-lg tracking-wide">Sign In to AMC Portal</span>
                  )}
                </button>
              </form>

              {/* Debug buttons (remove in production) */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex space-x-3 justify-center">
                  <button
                    type="button"
                    onClick={checkLocalStorage}
                    // className="px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {/* Check Storage */}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Simulate successful login for testing
                      const testUser = {
                        username: "Test Worker",
                        role: "worker",
                        message: "Login successful"
                      };
                      localStorage.setItem("user", JSON.stringify(testUser));
                      console.log("Test user saved:", testUser);
                      navigate("/dashboard");
                    }}
                    // className="px-4 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    {/* Test Login */}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center leading-6">
                  © 2025 CMTI - Advanced Material Characterization Team. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;