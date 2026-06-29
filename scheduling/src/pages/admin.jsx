import React, { useState } from "react";
import axios from "axios";
import { UserPlus, Mail, Lock, User, CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "../components/ui";

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
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <UserPlus size={28} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Worker Account</h1>
            <p className="text-gray-600">Add new team member to the system</p>
          </div>

          <Card className="animate-slide-up">
            <CardContent className="p-8">
              {message && (
                <div className={`mb-6 p-4 rounded-xl border-2 ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  <div className="flex items-center">
                    {message.type === "success" ? (
                      <CheckCircle size={20} className="mr-3" />
                    ) : (
                      <XCircle size={20} className="mr-3" />
                    )}
                    <span className="font-medium">{message.text}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Worker Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors.username}
                  placeholder="Enter worker username"
                  leftIcon={<User size={18} className="text-gray-400" />}
                  required
                />

                <Input
                  label="Worker Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="Enter worker email address"
                  leftIcon={<Mail size={18} className="text-gray-400" />}
                  required
                />

                <Input
                  label="Worker Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Set worker password"
                  leftIcon={<Lock size={18} className="text-gray-400" />}
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Worker Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="user">Project Associate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  fullWidth
                  size="lg"
                  leftIcon={<UserPlus size={20} />}
                >
                  Create Worker Account
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm">
                  Manage existing workers?{" "}
                  <a href="/workers" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                    View all workers
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}