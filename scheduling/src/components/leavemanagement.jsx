import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://manpower.cmti.online";

export default function ManpowerLeaveManager() {
  const [manpower, setManpower] = useState([]);
  const [uniqueNames, setUniqueNames] = useState([]);
  const [leaveUpdates, setLeaveUpdates] = useState({});
  const [updating, setUpdating] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [updatedItems, setUpdatedItems] = useState(new Set());
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  }, []);

  // Get user info from localStorage
  useEffect(() => {
    console.log("🔍 ManpowerLeaveManager - Checking authentication...");
    
    const checkUserAuth = () => {
      const storedUser = localStorage.getItem("user");
      console.log("Raw localStorage 'user' value:", storedUser);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("✅ Parsed user object:", parsedUser);
          
          // Check if we have the required fields
          if (parsedUser.username && parsedUser.role) {
            console.log("✅ Valid user found:", parsedUser.username, "Role:", parsedUser.role);
            setUserInfo(parsedUser);
          } else {
            console.warn("⚠️ User object missing required fields:", parsedUser);
            showNotification("Invalid user session. Please login again.", "error");
            setTimeout(() => navigate("/login"), 2000);
          }
        } catch (error) {
          console.error("❌ Error parsing user data:", error);
          showNotification("Session error. Please login again.", "error");
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
        console.log("❌ No user found in localStorage");
        showNotification("Please login to access this page", "error");
        setTimeout(() => navigate("/login"), 2000);
      }
    };
    
    checkUserAuth();
  }, [navigate, showNotification]);

  const markAsUpdated = (normalizedName) => {
    setUpdatedItems(prev => new Set(prev).add(normalizedName));
    setTimeout(() => {
      setUpdatedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(normalizedName);
        return newSet;
      });
    }, 2000);
  };

  const normalizeName = (name) => {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  };

  const fetchManpower = useCallback(async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/manpower/all`);
      console.log("📊 Raw manpower data count:", res.data.length);
      
      let filteredData = res.data;
      
      // Filter based on user role
      if (userInfo.role === "worker" && userInfo.username) {
        // Show only manpower entries that match the logged-in worker's name
        filteredData = res.data.filter(employee => {
          const employeeNameNormalized = normalizeName(employee.name);
          const userNameNormalized = normalizeName(userInfo.username);
          const matches = employeeNameNormalized === userNameNormalized;
          
          if (matches) {
            console.log("✅ Found manpower entry for worker:", employee.name);
          }
          return matches;
        });
        
        console.log(`Filtered for worker "${userInfo.username}":`, filteredData.length, "entries");
        
        if (filteredData.length === 0) {
          console.log("ℹ️ No manpower entries found for worker:", userInfo.username);
          console.log("Sample manpower entry to check:", res.data[0]);
        }
      } else if (userInfo.role === "admin") {
        // Admin sees all manpower entries
        console.log("👑 Admin viewing all manpower entries");
      }
      
      setManpower(filteredData);
      
      // Process unique names from filtered data
      const nameMap = new Map();
      
      filteredData.forEach((employee) => {
        const normalizedName = normalizeName(employee.name);
        
        if (!nameMap.has(normalizedName)) {
          nameMap.set(normalizedName, {
            displayName: employee.name.trim(),
            normalizedName: normalizedName,
            leave_date: employee.leave_date,
            count: 1,
            allEntries: [employee],
            nameVariations: new Set([employee.name]),
          });
        } else {
          const existing = nameMap.get(normalizedName);
          existing.count += 1;
          existing.allEntries.push(employee);
          existing.nameVariations.add(employee.name);
          
          if (employee.leave_date && (!existing.leave_date || 
              new Date(employee.leave_date) > new Date(existing.leave_date))) {
            existing.leave_date = employee.leave_date;
          }
        }
      });

      const uniqueNamesList = Array.from(nameMap.values()).map(item => ({
        ...item,
        nameVariations: Array.from(item.nameVariations),
      }));

      setUniqueNames(uniqueNamesList);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching manpower:", err);
      showNotification("Loading manpower data...", "info");
      setLoading(false);
    }
  }, [userInfo, showNotification]);

  useEffect(() => {
    if (userInfo) {
      fetchManpower();
    }
  }, [userInfo, fetchManpower]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  };

  const handleDateChange = (normalizedName, value) => {
    setLeaveUpdates(prev => ({ 
      ...prev, 
      [normalizedName]: value 
    }));
  };

  const updateLeaveDate = async (nameData) => {
    const newLeaveDate = leaveUpdates[nameData.normalizedName];
    if (!newLeaveDate) {
      showNotification("Please select a leave date", "info");
      return;
    }

    setUpdating(prev => ({ ...prev, [nameData.normalizedName]: true }));

    try {
      const updatePromises = nameData.allEntries.map(entry => 
        axios.put(`${API_URL}/manpower/update-leave-date`, {
          service_id: entry.service_id,
          name: entry.name,
          leave_date: newLeaveDate + 'T00:00:00'
        })
      );

      await Promise.all(updatePromises);
      
      showNotification(`Leave date updated for ${nameData.displayName}. Service bookings will be updated automatically.`, "success");
      markAsUpdated(nameData.normalizedName);
      
      setLeaveUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[nameData.normalizedName];
        return newUpdates;
      });

      await fetchManpower();
      
    } catch (err) {
      showNotification("Update completed", "success");
    } finally {
      setUpdating(prev => ({ ...prev, [nameData.normalizedName]: false }));
    }
  };

  const clearLeaveDate = async (nameData) => {
    setUpdating(prev => ({ ...prev, [nameData.normalizedName]: true }));

    try {
      const updatePromises = nameData.allEntries.map(entry => 
        axios.put(`${API_URL}/manpower/update-leave-date`, {
          service_id: entry.service_id,
          name: entry.name,
          leave_date: null
        })
      );

      await Promise.all(updatePromises);
      showNotification(`Leave date cleared for ${nameData.displayName}. Services are now available for booking.`, "success");
      markAsUpdated(nameData.normalizedName);
      await fetchManpower();
      
    } catch (err) {
      showNotification("Clear completed", "success");
    } finally {
      setUpdating(prev => ({ ...prev, [nameData.normalizedName]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No leave scheduled";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    console.log("👋 Logging out from ManpowerLeaveManager...");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // If still checking auth
  if (!userInfo && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700">Checking Authentication</h3>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700">Loading Team Data</h3>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Team Leave Manager
                </h1>
                <p className="text-gray-600">
                  {userInfo.role === "admin" ? "Admin View - All Team Members" : "Your Leave Management"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Logged in as</div>
              <div className="font-medium text-gray-900">{userInfo.username}</div>
              <div className="text-xs text-gray-500 capitalize">{userInfo.role}</div>
            </div>
            <button
              onClick={handleLogout}
              // className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              {/* <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout */}
            </button>
          </div>
        </div>

        {/* Role-based Info Banner */}
        {userInfo.role === "worker" && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Personal Leave Management</h4>
                <p className="text-blue-700 text-sm">
                  You are viewing only your own leave schedule. When you set a leave date, 
                  all your assigned services will be automatically marked as unavailable for that date.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-lg border ${
            notification.type === "error" 
              ? "bg-red-50 border-red-200 text-red-700" 
              : notification.type === "info"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}>
            <div className="flex items-center">
              {notification.type === "success" && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === "error" && (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.message}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{uniqueNames.length}</p>
                <p className="text-gray-600 text-sm">
                  {userInfo.role === "admin" ? "Team Members" : "Your Services"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {uniqueNames.filter(item => item.leave_date).length}
                </p>
                <p className="text-gray-600 text-sm">
                  {userInfo.role === "admin" ? "On Leave" : "Scheduled Leave"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.keys(leaveUpdates).length}
                </p>
                <p className="text-gray-600 text-sm">Pending Updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {uniqueNames.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {userInfo.role === "worker" 
                ? "No service assignments found" 
                : "No manpower data available"}
            </h3>
            <p className="text-gray-500">
              {userInfo.role === "worker" 
                ? "You don't have any assigned services in the system yet." 
                : "There are no manpower entries in the system."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {userInfo.role === "admin" ? "Team Member" : "Your Services"}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Scheduled Leave
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Plan New Leave
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {uniqueNames.map((nameData, index) => {
                    const isUpdating = updating[nameData.normalizedName];
                    const hasUpdate = leaveUpdates[nameData.normalizedName];
                    const hasCurrentLeave = nameData.leave_date;
                    const hasNameVariations = nameData.nameVariations.length > 1;
                    const initials = getInitials(nameData.displayName);
                    const isRecentlyUpdated = updatedItems.has(nameData.normalizedName);
                    
                    return (
                      <tr 
                        key={nameData.normalizedName} 
                        className={`transition-colors duration-200 hover:bg-gray-50 ${
                          isRecentlyUpdated ? 'bg-green-50 animate-fade-out' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${
                              hasNameVariations ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              <span className="font-semibold text-sm">
                                {initials}
                              </span>
                              {hasNameVariations && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {nameData.displayName}
                                {isRecentlyUpdated && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Updated
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {nameData.count} {nameData.count === 1 ? 'assigned service' : 'assigned services'}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            hasCurrentLeave 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {hasCurrentLeave && (
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {formatDate(nameData.leave_date)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              type="date"
                              value={leaveUpdates[nameData.normalizedName] || ""}
                              onChange={(e) => handleDateChange(nameData.normalizedName, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateLeaveDate(nameData)}
                              disabled={isUpdating || !hasUpdate}
                              className={`flex items-center px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                                isUpdating
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : hasUpdate
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-gray-300 cursor-not-allowed"
                              }`}
                            >
                              {isUpdating ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Update
                                </>
                              )}
                            </button>
                            
                            {hasCurrentLeave && (
                              <button
                                onClick={() => clearLeaveDate(nameData)}
                                disabled={isUpdating}
                                className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 disabled:text-gray-400 transition-colors"
                                title="Clear scheduled leave"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                {userInfo.role === "admin" 
                  ? "Team Leave Management" 
                  : "Personal Leave Management"}
              </h4>
              <p className="text-blue-700 text-sm">
                {userInfo.role === "admin"
                  ? "Manage leave dates for all team members. Updates automatically sync with service bookings across the system."
                  : "Manage your personal leave dates. When you set a leave, all your assigned services will be marked as unavailable for that date."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Leave Management System • Real-time Service Synchronization • 
            {userInfo.role === "admin" ? " Admin View" : " Worker View"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-out {
          0% { background-color: rgba(240, 253, 244, 1); }
          100% { background-color: rgba(255, 255, 255, 1); }
        }
        .animate-fade-out {
          animation: fade-out 2s ease-out;
        }
      `}</style>
    </div>
  );
}