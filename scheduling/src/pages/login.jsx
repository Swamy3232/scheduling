import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, ShieldAlert, Settings } from "lucide-react";
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
        "https://manpower.cmTI.online/auth/login", 
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
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      {/* Left side branding column (visible on md screens up) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20">
            <span className="font-bold text-white text-base">CMTI</span>
          </div>
          <span className="font-bold tracking-tight text-sm uppercase">AMC Scheduler</span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30">
            <Settings size={12} className="animate-spin-slow" /> Enterprise CMMS Suite
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Industrial Grade AMC Maintenance Scheduler
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Monitor, assign, and manage workforce allocations, schedules, and costs inside a unified enterprise workflow environment.
          </p>
        </div>

        <div className="text-xs text-blue-200/65 relative z-10">
          © {new Date().getFullYear()} Central Manufacturing Technology Institute. All rights reserved.
        </div>
      </div>

      {/* Right side form column */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-left space-y-2">
            {/* Logo for mobile view */}
            <div className="lg:hidden w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md mb-6">
              <span className="text-white font-extrabold text-lg">CMTI</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign In</h1>
            <p className="text-gray-500 text-sm">
              Please enter your workforce credentials to access the scheduling suite.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Workforce Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Enter your username"
              leftIcon={<User size={16} className="text-gray-400" />}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter your security password"
              leftIcon={<Lock size={16} className="text-gray-400" />}
            />

            <div className="pt-2">
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
                className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-100"
                rightIcon={!isLoading && <ArrowRight size={18} />}
              >
                {isLoading ? "Authenticating..." : "Sign In to Portal"}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;