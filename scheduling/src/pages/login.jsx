import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";
import { Button, Input } from "../components/ui";

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
      const res = await axios.post(
        "https://manpower.cmti.online/auth/login", 
        formData, 
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
      }
      
      const userData = {
        username: res.data.username || formData.username || res.data.user?.username,
        role: res.data.role?.toLowerCase() || res.data.user?.role?.toLowerCase() || "worker",
        message: res.data.message || "Login successful"
      };
      
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("role", userData.role);
      localStorage.setItem("isLoggedIn", "true");
      
      window.dispatchEvent(new Event("authChange"));
      
      setTimeout(() => {
        navigate("/bookings");
      }, 100);
      
    } catch (err) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">CMTI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your AMC Portal account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 animate-slide-up">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Enter your username"
              leftIcon={<User size={20} className="text-gray-400" />}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              leftIcon={<Lock size={20} className="text-gray-400" />}
            />

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="lg"
              rightIcon={!isLoading && <ArrowRight size={20} />}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} CMTI — All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;