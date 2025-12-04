import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
    remarks_update: "waiting"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [viewingRemarks, setViewingRemarks] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
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
    }
  }, [userInfo]);

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
      remarks_update: newRemarksUpdate
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
            remarks_update: editForm.remarks_update 
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
        setEditForm({ remarks: "", remarks_update: "waiting" });
      }
    }
  };

  const handleCancelEdit = () => {
    console.log("[handleCancelEdit] user cancelled edit");
    setEditingBooking(null);
    setEditForm({ remarks: "", remarks_update: "waiting" });
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
    const cfg = {
      upcoming: { color: "blue", text: "Upcoming" },
      ongoing: { color: "yellow", text: "In Progress" },
      completed: { color: "green", text: "Completed" },
      unknown: { color: "gray", text: "Unknown" },
    };

    const c = cfg[status] || cfg.unknown;

    return (
      <span
        className={`px-3 py-1 text-xs rounded-full bg-${c.color}-100 text-${c.color}-800`}
      >
        {c.text}
      </span>
    );
  };

  const getRemarksUpdateBadge = (remarks_update) => {
    const cfg = {
      waiting: { color: "yellow", text: "Waiting" },
      accepted: { color: "green", text: "Accepted" },
      rejected: { color: "red", text: "Rejected" },
    };

    const c = cfg[remarks_update] || cfg.waiting;

    return (
      <span
        className={`px-3 py-1 text-xs rounded-full bg-${c.color}-100 text-${c.color}-800`}
      >
        {c.text}
      </span>
    );
  };

  // If still checking auth
  if (!userInfo && !loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {userInfo.role === "admin" ? "Admin Dashboard" : "Staff Dashboard"}
            </h1>
            <p className="text-gray-500">
              {userInfo.role === "admin" 
                ? "Manage all service bookings" 
                : "Manage and track your service bookings"}
            </p>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Logged in as:</span> {userInfo.username} ({userInfo.role})
              {userInfo.role === "worker" && (
                <span className="ml-4 text-blue-600">
                  Showing only your assigned bookings
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => { 
                console.log("[Refresh button] clicked"); 
                fetchBookings(); 
              }}
              className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              // className="px-4 py-2 border rounded bg-red-50 text-red-600 hover:bg-red-100"
            >
              {/* Logout */}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card label="Total Bookings" value={stats.total} color="blue" />
          <Card label="Completed" value={stats.completed} color="green" />
          <Card label="In Progress" value={stats.ongoing} color="yellow" />
          <Card label="Upcoming" value={stats.upcoming} color="purple" />
        </div>

        {/* FILTERS */}
        <Filters filters={filters} handleFilterChange={handleFilterChange} />

        {/* EDIT MODAL */}
        {editingBooking && (
          <EditModal
            editingBooking={editingBooking}
            editForm={editForm}
            setEditForm={setEditForm}
            handleCancelEdit={handleCancelEdit}
            handleEditSubmit={handleEditSubmit}
            isEditing={isEditing}
          />
        )}

        {/* VIEW REMARKS MODAL */}
        {viewingRemarks && (
          <ViewRemarksModal
            booking={viewingRemarks}
            handleCloseRemarks={handleCloseRemarks}
            handleEditClick={handleEditClick}
          />
        )}

        {/* TABLE */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded shadow p-12 text-center">
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
            <button
              onClick={fetchBookings}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Check Again
            </button>
          </div>
        ) : (
          <BookingsTable
            filteredBookings={filteredBookings}
            getStatus={getStatus}
            getStatusBadge={getStatusBadge}
            getRemarksUpdateBadge={getRemarksUpdateBadge}
            handleEditClick={handleEditClick}
            handleViewRemarks={handleViewRemarks}
            userRole={userInfo.role}
          />
        )}
      </div>
    </div>
  );
};

/* -------------------- REUSABLE UI COMPONENTS ---------------------- */

const Card = ({ label, value, color }) => (
  <div className="bg-white p-6 rounded shadow">
    <p className="text-gray-600">{label}</p>
    <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

const Filters = ({ filters, handleFilterChange }) => (
  <div className="bg-white rounded shadow p-6 mb-6">
    <h3 className="font-semibold mb-4">Filters</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-sm text-gray-700">Search</label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full mt-1 p-2 border rounded"
          placeholder="Search bookings..."
        />
      </div>

      <div>
        <label className="text-sm text-gray-700">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="w-full mt-1 p-2 border rounded"
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
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">Next 7 Days</option>
          <option value="month">Next 30 Days</option>
        </select>
      </div>
    </div>
  </div>
);

const EditModal = ({
  editingBooking,
  editForm,
  setEditForm,
  handleCancelEdit,
  handleEditSubmit,
  isEditing,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded shadow w-96">
      <h3 className="text-lg font-semibold mb-4">
        Edit Remarks – {editingBooking.service_name}
      </h3>

      <form onSubmit={handleEditSubmit}>
        <div className="mb-4">
          <label className="text-sm text-gray-700">Status</label>
          <select
            value={editForm.remarks_update}
            onChange={(e) => setEditForm(prev => ({ ...prev, remarks_update: e.target.value }))}
            className="w-full mt-1 p-2 border rounded bg-gray-50"
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
          <label className="text-sm text-gray-700">Remarks</label>
          <textarea
            rows="4"
            value={editForm.remarks}
            onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
            className="w-full p-2 border rounded mt-1"
            placeholder="Add your remarks..."
          />
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isEditing}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {isEditing ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ViewRemarksModal = ({ booking, handleCloseRemarks, handleEditClick }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded shadow w-96 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">
        Remarks – {booking.service_name}
      </h3>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700">Remarks:</label>
        <div className="mt-2 p-4 bg-gray-50 border rounded max-h-48 overflow-y-auto">
          {booking.remarks ? (
            <p className="text-gray-800 whitespace-pre-wrap">{booking.remarks}</p>
          ) : (
            <p className="text-gray-400 italic">No remarks available</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleCloseRemarks}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            handleCloseRemarks();
            handleEditClick(booking);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit Remarks
        </button>
      </div>
    </div>
  </div>
);

const BookingsTable = ({
  filteredBookings,
  getStatus,
  getStatusBadge,
  getRemarksUpdateBadge,
  handleEditClick,
  handleViewRemarks,
  userRole,
}) => (
  <div className="bg-white rounded shadow overflow-x-auto">
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
            "Timeline",
            "Status",
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
                <div className="font-semibold">{b.service_name}</div>
                <div className="text-gray-500 text-sm">ID: {b.service_id}</div>
              </td>

              <td className="px-6 py-4">
                {b.manpower_name || "-"}
                {userRole === "admin" && (
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
                  <button
                    onClick={() => handleViewRemarks(b)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    View Remarks
                  </button>
                ) : (
                  <span className="text-gray-400 italic">No remarks</span>
                )}
              </td>

              <td className="px-6 py-4">
                {getRemarksUpdateBadge(b.remarks_update || "waiting")}
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
                <button
                  onClick={() => handleEditClick(b)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Remarks
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default WorkerDashboard;