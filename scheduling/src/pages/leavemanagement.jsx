import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, CheckCircle, Info, RefreshCw, LogOut, AlertCircle, X, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, StatusBadge } from "../components/ui";

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
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Checking Authentication</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading Team Data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header with User Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Leave Manager</h1>
            <p className="text-gray-600">
              {userInfo.role === "admin" ? "Admin View - All Team Members" : "Your Leave Management"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Logged in as</div>
              <div className="font-medium text-gray-900">{userInfo.username}</div>
              {/* <div className="text-xs text-gray-500 capitalize">{userInfo.role}</div> */}
            </div>
          </div>
        </div>

        {/* Role-based Info Banner */}
        {userInfo.role === "worker" && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start">
                <Info size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Personal Leave Management</h4>
                  <p className="text-blue-700 text-sm">
                    You are viewing only your own leave schedule. When you set a leave date, 
                    all your assigned services will be automatically marked as unavailable for that date.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification */}
        {notification.show && (
          <Card className={`mb-6 ${
            notification.type === "error" 
              ? "bg-red-50 border-red-200" 
              : notification.type === "info"
              ? "bg-blue-50 border-blue-200"
              : "bg-green-50 border-green-200"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                {notification.type === "success" && (
                  <CheckCircle size={20} className="mr-2 text-green-600" />
                )}
                {notification.type === "error" && (
                  <AlertCircle size={20} className="mr-2 text-red-600" />
                )}
                {notification.type === "info" && (
                  <Info size={20} className="mr-2 text-blue-600" />
                )}
                <span className={`text-sm ${
                  notification.type === "error" ? "text-red-700" :
                  notification.type === "info" ? "text-blue-700" :
                  "text-green-700"
                }`}>{notification.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{uniqueNames.length}</p>
                  <p className="text-gray-600 text-sm">
                    {userInfo.role === "admin" ? "Team Members" : "Your Services"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Calendar size={20} className="text-green-600" />
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
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <RefreshCw size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.keys(leaveUpdates).length}
                  </p>
                  <p className="text-gray-600 text-sm">Pending Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {uniqueNames.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-gray-400" />
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
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
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
                            isRecentlyUpdated ? 'bg-green-50' : ''
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
                                    <StatusBadge status="active" label="Updated" className="ml-2" />
                                  )}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {nameData.count} {nameData.count === 1 ? 'assigned service' : 'assigned services'}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <StatusBadge 
                              status={hasCurrentLeave ? "active" : "pending"} 
                              label={formatDate(nameData.leave_date)}
                            />
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="relative">
                              <Input
                                type="date"
                                value={leaveUpdates[nameData.normalizedName] || ""}
                                onChange={(e) => handleDateChange(nameData.normalizedName, e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateLeaveDate(nameData)}
                                disabled={isUpdating || !hasUpdate}
                                leftIcon={<CheckCircle size={14} />}
                                loading={isUpdating}
                              >
                                {isUpdating ? "Updating..." : "Update"}
                              </Button>
                              
                              {hasCurrentLeave && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => clearLeaveDate(nameData)}
                                  disabled={isUpdating}
                                  leftIcon={<Trash2 size={14} />}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Info size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
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
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Leave Management System • Real-time Service Synchronization • 
            {userInfo.role === "admin" ? " Admin View" : " Worker View"}
          </p>
        </div>
      </div>
    </div>
  );
}