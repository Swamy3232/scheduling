import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, AlertTriangle, Edit, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Textarea, StatusBadge } from "../components/ui";

const WorkerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: ""
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({ 
    remarks: "",
    remarks_update: "waiting",
    workstatus: "pending"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [viewingRemarks, setViewingRemarks] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [overdueBookings, setOverdueBookings] = useState([]);
  const navigate = useNavigate();

  // Enhanced localStorage check
  useEffect(() => {
    console.log("🔍 WorkerDashboard - Checking for user authentication...");
    
    // Check for user in localStorage
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
            // Try to navigate back to login
            navigate("/login");
          }
        } catch (error) {
          console.error("❌ Error parsing user data:", error);
          localStorage.removeItem("user");
          navigate("/login");
        }
      } else {
        console.log("❌ No user found in localStorage, redirecting to login...");
        navigate("/login");
      }
    };
    
    checkUserAuth();
    
    // Also check all localStorage for debugging
    console.log("📋 All localStorage items:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}: ${localStorage.getItem(key)}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (userInfo) {
      console.log("📊 User authenticated, fetching bookings...");
      fetchBookings();
      
      // Check for overdue bookings every 30 seconds
      const overdueInterval = setInterval(checkOverdueBookings, 30000);
      
      return () => clearInterval(overdueInterval);
    }
  }, [userInfo]);

  const checkOverdueBookings = () => {
    const now = new Date();
    const overdue = bookings.filter((booking) => {
      if (!booking.end_date) return false;
      
      const endDate = new Date(booking.end_date);
      const isTimeDone = now > endDate;
      const isNotCompleted = booking.workstatus !== "completed";
      
      return isTimeDone && isNotCompleted;
    });
    
    setOverdueBookings(overdue);
    
    if (overdue.length > 0) {
      console.warn("⚠️ WARNING: " + overdue.length + " booking(s) are overdue and not completed!");
      // Play a beep sound or browser notification
      playWarningSound();
    }
  };

  const playWarningSound = () => {
    // Create a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log("Could not play warning sound:", err);
    }
  };

  const fetchBookings = async () => {
    console.log("[fetchBookings] start");
    setLoading(true);
    try {
      const res = await axios.get("https://manpower.cmti.online/bookings/");
      console.log("[fetchBookings] success, total bookings:", Array.isArray(res.data) ? res.data.length : "?");
      
      // Filter bookings based on user role
      let filteredData = res.data;
      if (userInfo?.role === "worker" && userInfo?.username) {
        // Show only bookings assigned to this worker
        // Try different field names that might contain the worker's name
        filteredData = res.data.filter(booking => {
          const matches = 
            booking.manpower_name === userInfo.username ||
            booking.staff_name === userInfo.username ||
            booking.worker_name === userInfo.username ||
            booking.assigned_to === userInfo.username;
          
          if (matches) {
            console.log("✅ Booking assigned to worker:", booking.service_name);
          }
          return matches;
        });
        
        if (filteredData.length === 0) {
          console.log("ℹ️ No bookings found for worker:", userInfo.username);
          console.log("Sample booking to check field names:", res.data[0]);
        }
        
        console.log(`Filtered for worker "${userInfo.username}":`, filteredData.length, "bookings");
      } else if (userInfo?.role === "admin") {
        // Admin sees all bookings
        console.log("👑 Admin viewing all bookings");
      }
      
      setBookings(filteredData);
    } catch (err) {
      console.error("[fetchBookings] error:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
      console.log("[fetchBookings] done");
      // Check for overdue bookings after fetching
      setTimeout(checkOverdueBookings, 500);
    }
  };

  const getStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return "unknown";

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";

    return "unknown";
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const status = getStatus(booking.start_date, booking.end_date);

      if (filters.status !== "all" && status !== filters.status) return false;

      if (filters.search) {
        const term = filters.search.toLowerCase();
        const match =
          booking.service_name?.toLowerCase().includes(term) ||
          booking.manpower_name?.toLowerCase().includes(term) ||
          booking.remarks?.toLowerCase().includes(term) ||
          booking.service_id?.toString().toLowerCase().includes(term);

        if (!match) return false;
      }

      if (filters.dateRange !== "all" && booking.start_date) {
        const startDate = new Date(booking.start_date);
        const now = new Date();

        const diff = Math.ceil((startDate - now) / (1000 * 3600 * 24));

        switch (filters.dateRange) {
          case "today":
            return startDate.toDateString() === now.toDateString();
          case "week":
            return diff >= 0 && diff <= 7;
          case "month":
            return diff >= 0 && diff <= 30;
          default:
            return true;
        }
      }

      return true;
    });
  }, [bookings, filters]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(
      (b) => getStatus(b.start_date, b.end_date) === "completed"
    ).length;
    const ongoing = bookings.filter(
      (b) => getStatus(b.start_date, b.end_date) === "ongoing"
    ).length;
    const upcoming = bookings.filter(
      (b) => getStatus(b.start_date, b.end_date) === "upcoming"
    ).length;

    return { total, completed, ongoing, upcoming };
  }, [bookings]);

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
  };

  const handleEditClick = (booking) => {
    console.log("[handleEditClick] opening modal for booking:", booking);
    setEditingBooking(booking);
    
    const newRemarksUpdate = (booking.remarks_update === "accepted" || booking.remarks_update === "rejected") 
      ? "waiting" 
      : (booking.remarks_update || "waiting");
    
    setEditForm({ 
      remarks: booking.remarks || "",
      remarks_update: newRemarksUpdate,
      workstatus: booking.workstatus || "pending"
    });
    setIsEditing(false);
  };

  const handleViewRemarks = (booking) => {
    console.log("[handleViewRemarks] opening remarks modal for booking:", booking);
    setViewingRemarks(booking);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) {
      console.warn("[handleEditSubmit] no editingBooking present");
      return;
    }

    console.log("[handleEditSubmit] submitting. booking_id:", editingBooking.booking_id);
    let success = false;
    setIsEditing(true);

    try {
      const res = await axios.put(
        `https://manpower.cmti.online/bookings/${editingBooking.booking_id}`,
        null,
        { 
          params: { 
            remarks: editForm.remarks,
            remarks_update: editForm.remarks_update,
            workstatus: editForm.workstatus
          } 
        }
      );

      console.log("[handleEditSubmit] response:", res.status, res.data);

      success = true;
      await fetchBookings();
    } catch (err) {
      console.error("[handleEditSubmit] update failed:", err);
      alert("Failed to update remarks. Please try again.");
    } finally {
      setIsEditing(false);

      if (success) {
        setEditingBooking(null);
        setEditForm({ remarks: "", remarks_update: "waiting", workstatus: "pending" });
      }
    }
  };

  const handleCancelEdit = () => {
    console.log("[handleCancelEdit] user cancelled edit");
    setEditingBooking(null);
    setEditForm({ remarks: "", remarks_update: "waiting", workstatus: "pending" });
    setIsEditing(false);
  };

  const handleCloseRemarks = () => {
    console.log("[handleCloseRemarks] closing remarks modal");
    setViewingRemarks(null);
  };

  const handleLogout = () => {
    console.log("👋 Logging out...");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: "pending",
      ongoing: "active",
      completed: "inactive",
      unknown: "pending"
    };
    const labelMap = {
      upcoming: "Upcoming",
      ongoing: "In Progress",
      completed: "Completed",
      unknown: "Unknown"
    };
    return <StatusBadge status={statusMap[status] || "pending"} label={labelMap[status] || "Unknown"} />;
  };

  const getRemarksUpdateBadge = (remarks_update) => {
    const statusMap = {
      waiting: "pending",
      accepted: "active",
      rejected: "inactive"
    };
    const labelMap = {
      waiting: "Waiting",
      accepted: "Accepted",
      rejected: "Rejected"
    };
    return <StatusBadge status={statusMap[remarks_update] || "pending"} label={labelMap[remarks_update] || "Waiting"} />;
  };

  const getWorkStatusBadge = (workstatus) => {
    const statusMap = {
      pending: "pending",
      "in-progress": "active",
      completed: "inactive",
      hold: "pending"
    };
    const labelMap = {
      pending: "Pending",
      "in-progress": "In Progress",
      completed: "Completed",
      hold: "On Hold"
    };
    const config = {
      pending: { animate: true },
      "in-progress": { animate: false },
      completed: { animate: false },
      hold: { animate: false }
    };
    return (
      <StatusBadge 
        status={statusMap[workstatus] || "pending"} 
        label={labelMap[workstatus] || "Pending"}
        animate={config[workstatus]?.animate || false}
      />
    );
  };

  // If still checking auth
  if (!userInfo && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Checking authentication...</span>
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
              <span className="text-gray-500">Loading bookings...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {userInfo.role === "admin" ? "Admin Dashboard" : "Staff Dashboard"}
            </h1>
            <p className="text-gray-600">
              {userInfo.role === "admin" 
                ? "Manage all service bookings" 
                : "Manage and track your service bookings"}
            </p>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Logged in as:</span>
              {userInfo.role === "worker" && (
                <span className="ml-4 text-blue-600">
                  Showing only your assigned bookings
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={fetchBookings}
              leftIcon={<RefreshCw size={20} />}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* OVERDUE WARNING BANNER */}
        {overdueBookings.length > 0 && (
          <Card className="mb-6 border-l-4 border-red-600 animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">
                    URGENT: {overdueBookings.length} Booking(s) Are Overdue!
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    The following services have exceeded their scheduled end time and are still not marked as completed:
                  </p>
                  <div className="mt-3 space-y-2">
                    {overdueBookings.map((booking, idx) => (
                      <div key={idx} className="bg-white rounded p-3 border-l-2 border-red-600">
                        <div className="font-semibold text-red-800">{booking.service_name}</div>
                        <div className="text-sm text-red-700">
                          <strong>Staff:</strong> {booking.manpower_name || "Unassigned"}
                        </div>
                        <div className="text-sm text-red-700">
                          <strong>Scheduled End:</strong> {new Date(booking.end_date).toLocaleString("en-IN")}
                        </div>
                        <div className="text-sm text-red-700">
                          <strong>Current Status:</strong> {booking.workstatus || "Unknown"}
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleEditClick(booking)}
                          className="mt-2"
                          leftIcon={<Edit size={14} />}
                        >
                          Update Status Now
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.ongoing}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-purple-600">{stats.upcoming}</p>
            </CardContent>
          </Card>
        </div>

        {/* FILTERS */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700">Search</label>
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search bookings..."
                  leftIcon={<Search size={18} className="text-gray-400" />}
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EDIT MODAL */}
        <Modal isOpen={!!editingBooking} onClose={handleCancelEdit} size="md">
          <ModalHeader>
            <CardTitle>Update Booking – {editingBooking?.service_name}</CardTitle>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Work Status *</label>
                <select
                  value={editForm.workstatus}
                  onChange={(e) => setEditForm(prev => ({ ...prev, workstatus: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="hold">On Hold</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Update the current status of your work
                </p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Remarks Status</label>
                <select
                  value={editForm.remarks_update}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks_update: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled
                >
                  <option value="waiting">Waiting</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Status automatically changes to "Waiting" when remarks are edited
                </p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Remarks</label>
                <Textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Add your remarks..."
                  rows={4}
                />
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
              <Button
                onClick={handleEditSubmit}
                disabled={isEditing}
                loading={isEditing}
              >
                {isEditing ? "Updating..." : "Update"}
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* VIEW REMARKS MODAL */}
        <Modal isOpen={!!viewingRemarks} onClose={handleCloseRemarks} size="sm">
          <ModalHeader>
            <CardTitle>Remarks – {viewingRemarks?.service_name}</CardTitle>
          </ModalHeader>
          <ModalBody>
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700">Remarks:</label>
              <div className="mt-2 p-4 bg-gray-50 border rounded-lg max-h-48 overflow-y-auto">
                {viewingRemarks?.remarks ? (
                  <p className="text-gray-800 whitespace-pre-wrap">{viewingRemarks.remarks}</p>
                ) : (
                  <p className="text-gray-400 italic">No remarks available</p>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={handleCloseRemarks}>Close</Button>
              <Button
                onClick={() => {
                  handleCloseRemarks();
                  handleEditClick(viewingRemarks);
                }}
                leftIcon={<Edit size={16} />}
              >
                Edit Remarks
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* TABLE */}
        {bookings.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-700">
                {userInfo.role === "worker" 
                  ? "No bookings assigned to you yet" 
                  : "No bookings found"}
              </h3>
              <p className="text-gray-500 mt-2">
                {userInfo.role === "worker" 
                  ? "You don't have any assigned service bookings at the moment." 
                  : "There are no bookings in the system."}
              </p>
              <Button
                onClick={fetchBookings}
                className="mt-4"
                leftIcon={<RefreshCw size={16} />}
              >
                Check Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Service Details",
                        "Staff",
                        "Department",
                        "Category",
                        "Price Type",
                        "Remarks",
                        "Remarks Status",
                        "Work Status",
                        "Timeline",
                        "Timeline Status",
                        "Actions",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredBookings.map((b, idx) => {
                      const status = getStatus(b.start_date, b.end_date);
                      const hasRemarks = b.remarks && b.remarks.trim().length > 0;

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{b.service_name}</div>
                            <div className="text-gray-500 text-sm">ID: {b.service_id}</div>
                          </td>

                          <td className="px-6 py-4">
                            {b.manpower_name || "-"}
                            {userInfo?.role === "admin" && (
                              <div className="text-xs text-blue-600 mt-1">
                                {b.manpower_name ? "Assigned" : "Unassigned"}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">{b.department || "-"}</td>

                          <td className="px-6 py-4 capitalize">{b.category || "-"}</td>

                          <td className="px-6 py-4">
                            {b.price_type
                      ? b.price_type.replace("_", " ").toUpperCase()
                      : "-"}
                          </td>

                          <td className="px-6 py-4">
                            {hasRemarks ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewRemarks(b)}
                                leftIcon={<Eye size={14} />}
                              >
                                View Remarks
                              </Button>
                            ) : (
                              <span className="text-gray-400 italic">No remarks</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {getRemarksUpdateBadge(b.remarks_update || "waiting")}
                          </td>

                          <td className="px-6 py-4">
                            {getWorkStatusBadge(b.workstatus || "pending")}
                          </td>

                          <td className="px-6 py-4 text-sm">
                            <div>
                              <strong>Start:</strong>{" "}
                              {b.start_date
                                ? new Date(b.start_date).toLocaleString("en-IN")
                                : "Not set"}
                            </div>
                            <div className="text-gray-500 mt-1">
                              <strong>End:</strong>{" "}
                              {b.end_date
                                ? new Date(b.end_date).toLocaleString("en-IN")
                                : "Not set"}
                            </div>
                          </td>

                          <td className="px-6 py-4">{getStatusBadge(status)}</td>

                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              onClick={() => handleEditClick(b)}
                              leftIcon={<Edit size={14} />}
                            >
                              Add Remarks
                            </Button>
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
      </div>
    </div>
  );
};

export default WorkerDashboard;