import React, { useState } from "react";
import axios from "axios";
import { UserPlus, Mail, Lock, User, CheckCircle, XCircle, Shield, Sliders } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "../components/ui";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "worker",
  });
  const [message, setMessage] = useState(null);
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
    setMessage(null);
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
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Sliders size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>⚙️</span> System Administration
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Configure system roles, manage users, and create workforce accounts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Info Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-50 bg-gray-50/20">
              <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={16} className="text-blue-500" /> Administrative Access
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                As an administrator, you can provision accounts with specific permissions. Ensure that you select the appropriate role:
              </p>
              
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 space-y-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  Project Associate
                </span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Default workforce credentials. Allows logging in to view assigned slots, request leaves, and manage tasks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/50 space-y-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                  Administrator
                </span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Full administrative permissions. Allows creating bookings, managing catalogs, and downloading cost reports.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
              <CardTitle className="text-base font-bold text-gray-800">Provision User Account</CardTitle>
              <p className="text-xs text-gray-400 mt-1">Configure credentials for the new team member</p>
            </CardHeader>
            <CardContent className="p-6">
              
              {message && (
                <div className={`mb-6 p-4 rounded-xl border font-semibold flex items-center gap-2 shadow-sm ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {message.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Username *"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    placeholder="e.g. JohnDoe"
                    leftIcon={<User size={16} className="text-gray-400" />}
                    required
                  />

                  <Input
                    label="Email Address *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="e.g. john@cmti.online"
                    leftIcon={<Mail size={16} className="text-gray-400" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Password *"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Set temporary password"
                    leftIcon={<Lock size={16} className="text-gray-400" />}
                    required
                  />

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Assign Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-700 font-semibold"
                      required
                    >
                      <option value="worker">Project Associate</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    loading={isLoading}
                    className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-sm shadow-blue-100"
                    leftIcon={<UserPlus size={18} />}
                  >
                    Create Member Account
                  </Button>
                </div>
              </form>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}