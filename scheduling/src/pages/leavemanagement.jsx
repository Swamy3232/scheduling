import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, CheckCircle, Info, RefreshCw, LogOut, AlertCircle, X, Trash2, CalendarIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "../components/ui";

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
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.username && parsedUser.role) {
            setUserInfo(parsedUser);
          } else {
            showNotification("Invalid user session. Please login again.", "error");
            setTimeout(() => navigate("/login"), 2000);
          }
        } catch (error) {
          console.error("❌ Error parsing user data:", error);
          showNotification("Session error. Please login again.", "error");
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
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
      let filteredData = res.data;
      
      // Filter based on user role
      if (userInfo.role === "worker" && userInfo.username) {
        filteredData = res.data.filter(employee => {
          const employeeNameNormalized = normalizeName(employee.name);
          const userNameNormalized = normalizeName(userInfo.username);
          return employeeNameNormalized === userNameNormalized;
        });
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
      
      // Update local state
      setUniqueNames(prev => prev.map(item => {
        if (item.normalizedName === nameData.normalizedName) {
          return { ...item, leave_date: newLeaveDate + 'T00:00:00' };
        }
        return item;
      }));

      // Clear input field
      setLeaveUpdates(prev => {
        const copy = { ...prev };
        delete copy[nameData.normalizedName];
        return copy;
      });
      
      await fetchManpower();
      
    } catch (error) {
      console.error("Error updating leave date:", error);
      showNotification(error.response?.data?.detail || "Failed to update leave date", "error");
    } finally {
      setUpdating(prev => ({ ...prev, [nameData.normalizedName]: false }));
    }
  };

  const clearLeaveDate = async (nameData) => {
    if (!window.confirm(`Are you sure you want to clear the leave date for ${nameData.displayName}?`)) {
      return;
    }

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
      
      showNotification(`Leave date cleared for ${nameData.displayName}`, "success");
      markAsUpdated(nameData.normalizedName);

      // Update local state
      setUniqueNames(prev => prev.map(item => {
        if (item.normalizedName === nameData.normalizedName) {
          return { ...item, leave_date: null };
        }
        return item;
      }));

      await fetchManpower();
      
    } catch (error) {
      console.error("Error clearing leave date:", error);
      showNotification("Failed to clear leave date", "error");
    } finally {
      setUpdating(prev => ({ ...prev, [nameData.normalizedName]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!userInfo && !loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-8 space-y-3">
          <RefreshCw className="animate-spin mx-auto text-blue-600" size={24} />
          <p className="text-xs text-gray-500 font-semibold font-sans">Resolving session security...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 max-w-none">
      
      {/* Top Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>📅</span> Workforce Leave Administration
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Schedule unavailable leaves, manage technician block-out dates, and organize roster planning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchManpower}
            className="h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 font-medium px-4 text-gray-700 shadow-sm"
            leftIcon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="h-11 rounded-xl font-medium px-4 shadow-sm"
            leftIcon={<LogOut size={16} />}
          >
            Log Out
          </Button>
        </div>
      </div>

      {notification.show && (
        <div className={`mb-6 p-4 rounded-xl border font-semibold flex items-center gap-2 shadow-sm ${
          notification.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Database Leave Grid Table */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              <p className="text-xs">Fetching leave directory...</p>
            </div>
          ) : uniqueNames.length === 0 ? (
            <div className="px-6 py-16 text-center max-w-md mx-auto flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No personnel entries</h4>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                You are not registered in the manpower roster directory.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-100">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Engineer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Leave Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Update / Apply Leave</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {uniqueNames.map((nameData) => {
                    const isUpdated = updatedItems.has(nameData.normalizedName);
                    const isUpdating = updating[nameData.normalizedName];
                    const pendingDate = leaveUpdates[nameData.normalizedName] || "";
                    
                    return (
                      <tr 
                        key={nameData.normalizedName} 
                        className={`transition-colors duration-500 ${
                          isUpdated ? "bg-green-50/70" : "hover:bg-blue-50/10"
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {nameData.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{nameData.displayName}</p>
                              <span className="text-[10px] text-gray-400 font-medium">User Profile: {nameData.normalizedName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs">
                          {nameData.leave_date ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <CalendarIcon size={12} />
                              {new Date(nameData.leave_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-semibold text-xs">🟢 Available (No Active Leaves)</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="date"
                              value={pendingDate}
                              onChange={(e) => handleDateChange(nameData.normalizedName, e.target.value)}
                              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                            />
                            <Button
                              size="sm"
                              disabled={isUpdating || !pendingDate}
                              onClick={() => updateLeaveDate(nameData)}
                              className="rounded-lg text-xs"
                            >
                              {isUpdating ? "Saving..." : "Apply"}
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-semibold">
                          {nameData.leave_date && (
                            <button
                              onClick={() => clearLeaveDate(nameData)}
                              disabled={isUpdating}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                              title="Clear Leave Date"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}